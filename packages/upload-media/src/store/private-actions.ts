/**
 * External dependencies
 */
import { v4 as uuidv4 } from 'uuid';

/**
 * WordPress dependencies
 */
import { createBlobURL, isBlobURL, revokeBlobURL } from '@wordpress/blob';
// eslint-disable-next-line no-restricted-syntax
import type { WPDataRegistry } from '@wordpress/data/build-types/registry';
// @ts-ignore -- No types available yet.
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import { ImageFile } from '../image-file';
import { UploadError } from '../upload-error';
import {
	cloneFile,
	convertBlobToFile,
	getFileBasename,
	getFileExtension,
	isImageTypeSupported,
	renameFile,
} from '../utils';
import { PREFERENCES_NAME } from '../constants';
import { StubFile } from '../stub-file';
import { vipsCompressImage, vipsResizeImage } from './utils/vips';
import type {
	AddAction,
	AdditionalData,
	AddOperationsAction,
	Attachment,
	BatchId,
	CacheBlobUrlAction,
	ImageFormat,
	OnBatchSuccessHandler,
	OnChangeHandler,
	OnErrorHandler,
	OnSuccessHandler,
	Operation,
	OperationArgs,
	OperationFinishAction,
	OperationStartAction,
	PauseItemAction,
	PauseQueueAction,
	QueueItem,
	QueueItemId,
	ResumeItemAction,
	ResumeQueueAction,
	RevokeBlobUrlsAction,
	SideloadAdditionalData,
	State,
	ThumbnailGeneration,
} from './types';
import { ItemStatus, OperationType, Type } from './types';
import type { cancelItem } from './actions';

type ActionCreators = {
	cancelItem: typeof cancelItem;
	addItem: typeof addItem;
	addSideloadItem: typeof addSideloadItem;
	removeItem: typeof removeItem;
	prepareItem: typeof prepareItem;
	processItem: typeof processItem;
	finishOperation: typeof finishOperation;
	uploadItem: typeof uploadItem;
	sideloadItem: typeof sideloadItem;
	resumeItem: typeof resumeItem;
	resizeCropItem: typeof resizeCropItem;
	optimizeImageItem: typeof optimizeImageItem;
	generateThumbnails: typeof generateThumbnails;
	uploadOriginal: typeof uploadOriginal;
	revokeBlobUrls: typeof revokeBlobUrls;
	< T = Record< string, unknown > >( args: T ): void;
};

type AllSelectors = typeof import('./selectors') &
	typeof import('./private-selectors');
type CurriedState< F > = F extends ( state: State, ...args: infer P ) => infer R
	? ( ...args: P ) => R
	: F;
type Selectors = {
	[ key in keyof AllSelectors ]: CurriedState< AllSelectors[ key ] >;
};

type ThunkArgs = {
	select: Selectors;
	dispatch: ActionCreators;
	registry: WPDataRegistry;
};

interface AddItemArgs {
	// It should always be a File, but some consumers might still pass Blobs only.
	file: File | Blob;
	batchId?: BatchId;
	onChange?: OnChangeHandler;
	onSuccess?: OnSuccessHandler;
	onError?: OnErrorHandler;
	onBatchSuccess?: OnBatchSuccessHandler;
	additionalData?: AdditionalData;
	sourceUrl?: string;
	sourceAttachmentId?: number;
	abortController?: AbortController;
	operations?: Operation[];
}

/**
 * Adds a new item to the upload queue.
 *
 * @param $0
 * @param $0.file                 File
 * @param [$0.batchId]            Batch ID.
 * @param [$0.onChange]           Function called each time a file or a temporary representation of the file is available.
 * @param [$0.onSuccess]          Function called after the file is uploaded.
 * @param [$0.onBatchSuccess]     Function called after a batch of files is uploaded.
 * @param [$0.onError]            Function called when an error happens.
 * @param [$0.additionalData]     Additional data to include in the request.
 * @param [$0.sourceUrl]          Source URL. Used when importing a file from a URL or optimizing an existing file.
 * @param [$0.sourceAttachmentId] Source attachment ID. Used when optimizing an existing file for example.
 * @param [$0.abortController]    Abort controller for upload cancellation.
 * @param [$0.operations]         List of operations to perform. Defaults to automatically determined list, based on the file.
 */
export function addItem( {
	file: fileOrBlob,
	batchId,
	onChange,
	onSuccess,
	onBatchSuccess,
	onError,
	additionalData = {} as AdditionalData,
	sourceUrl,
	sourceAttachmentId,
	abortController,
	operations,
}: AddItemArgs ) {
	return async ( { dispatch, registry }: ThunkArgs ) => {
		const thumbnailGeneration: ThumbnailGeneration = registry
			.select( preferencesStore )
			.get( PREFERENCES_NAME, 'thumbnailGeneration' );

		const itemId = uuidv4();

		// Hardening in case a Blob is passed instead of a File.
		// See https://github.com/WordPress/gutenberg/pull/65693 for an example.
		const file = convertBlobToFile( fileOrBlob );

		let blobUrl;

		// StubFile could be coming from addItemFromUrl().
		if ( ! ( file instanceof StubFile ) ) {
			blobUrl = createBlobURL( file );
			dispatch< CacheBlobUrlAction >( {
				type: Type.CacheBlobUrl,
				id: itemId,
				blobUrl,
			} );
		}

		dispatch< AddAction >( {
			type: Type.Add,
			item: {
				id: itemId,
				batchId,
				status: ItemStatus.Processing,
				sourceFile: cloneFile( file ),
				file,
				attachment: {
					url: blobUrl,
				},
				additionalData: {
					generate_sub_sizes: 'server' === thumbnailGeneration,
					convert_format: false,
					...additionalData,
				},
				onChange,
				onSuccess,
				onBatchSuccess,
				onError,
				sourceUrl,
				sourceAttachmentId,
				abortController: abortController || new AbortController(),
				operations: Array.isArray( operations )
					? operations
					: [ OperationType.Prepare ],
			},
		} );

		dispatch.processItem( itemId );
	};
}

interface AddSideloadItemArgs {
	file: File;
	onChange?: OnChangeHandler;
	additionalData?: AdditionalData;
	operations?: Operation[];
	batchId?: BatchId;
	parentId?: QueueItemId;
}

/**
 * Adds a new item to the upload queue for sideloading.
 *
 * This is typically a poster image or a client-side generated thumbnail.
 *
 * @param $0
 * @param $0.file             File
 * @param [$0.batchId]        Batch ID.
 * @param [$0.parentId]       Parent ID.
 * @param [$0.onChange]       Function called each time a file or a temporary representation of the file is available.
 * @param [$0.additionalData] Additional data to include in the request.
 * @param [$0.operations]     List of operations to perform. Defaults to automatically determined list, based on the file.
 */
export function addSideloadItem( {
	file,
	onChange,
	additionalData,
	operations,
	batchId,
	parentId,
}: AddSideloadItemArgs ) {
	return async ( { dispatch }: { dispatch: ActionCreators } ) => {
		const itemId = uuidv4();
		dispatch< AddAction >( {
			type: Type.Add,
			item: {
				id: itemId,
				batchId,
				status: ItemStatus.Processing,
				sourceFile: cloneFile( file ),
				file,
				onChange,
				additionalData: {
					...additionalData,
				},
				parentId,
				operations: Array.isArray( operations )
					? operations
					: [ OperationType.Prepare ],
				abortController: new AbortController(),
			},
		} );

		dispatch.processItem( itemId );
	};
}

/**
 * Processes a single item in the queue.
 *
 * Runs the next operation in line and invokes any callbacks.
 *
 * @param id Item ID.
 */
export function processItem( id: QueueItemId ) {
	return async ( { select, dispatch }: ThunkArgs ) => {
		if ( select.isPaused() ) {
			return;
		}

		const item = select.getItem( id ) as QueueItem;

		if ( item.status === ItemStatus.PendingApproval ) {
			return;
		}

		const {
			attachment,
			onChange,
			onSuccess,
			onBatchSuccess,
			batchId,
			parentId,
		} = item;

		const operation = Array.isArray( item.operations?.[ 0 ] )
			? item.operations[ 0 ][ 0 ]
			: item.operations?.[ 0 ];
		// TODO: Improve type here to avoid using "as" further down.
		const operationArgs = Array.isArray( item.operations?.[ 0 ] )
			? item.operations[ 0 ][ 1 ]
			: undefined;

		// If we're sideloading a thumbnail, pause upload to avoid race conditions.
		// It will be resumed after the previous upload finishes.
		if (
			operation === OperationType.Upload &&
			item.parentId &&
			item.additionalData.post
		) {
			const isAlreadyUploading = select.isUploadingToPost(
				item.additionalData.post as number
			);
			if ( isAlreadyUploading ) {
				dispatch< PauseItemAction >( {
					type: Type.PauseItem,
					id,
				} );
				return;
			}
		}

		if ( attachment ) {
			onChange?.( [ attachment ] );
		}

		/*
		 If there are no more operations, the item can be removed from the queue,
		 but only if there are no thumbnails still being side-loaded,
		 or if itself is a side-loaded item.
		*/

		if ( ! operation ) {
			if (
				parentId ||
				( ! parentId && ! select.isUploadingByParentId( id ) )
			) {
				if ( attachment ) {
					onSuccess?.( [ attachment ] );
				}

				dispatch.removeItem( id );
				dispatch.revokeBlobUrls( id );

				if ( batchId && select.isBatchUploaded( batchId ) ) {
					onBatchSuccess?.();
				}
			}

			// All other side-loaded items have been removed, so remove the parent too.
			if ( parentId && batchId && select.isBatchUploaded( batchId ) ) {
				const parentItem = select.getItem( parentId ) as QueueItem;

				if ( attachment ) {
					parentItem.onSuccess?.( [ attachment ] );
				}

				dispatch.removeItem( parentId );
				dispatch.revokeBlobUrls( parentId );

				if (
					parentItem.batchId &&
					select.isBatchUploaded( parentItem.batchId )
				) {
					parentItem.onBatchSuccess?.();
				}
			}

			/*
			 At this point we are dealing with a parent whose children haven't fully uploaded yet.
			 Do nothing and let the removal happen once the last side-loaded item finishes.
			 */

			return;
		}

		if ( ! operation ) {
			// This shouldn't really happen.
			return;
		}

		dispatch< OperationStartAction >( {
			type: Type.OperationStart,
			id,
			operation,
		} );

		switch ( operation ) {
			case OperationType.Prepare:
				dispatch.prepareItem( item.id );
				break;

			case OperationType.ResizeCrop:
				dispatch.resizeCropItem(
					item.id,
					operationArgs as OperationArgs[ OperationType.ResizeCrop ]
				);
				break;

			case OperationType.TranscodeImage:
				dispatch.optimizeImageItem(
					item.id,
					operationArgs as OperationArgs[ OperationType.TranscodeImage ]
				);
				break;

			case OperationType.Upload:
				if ( item.parentId ) {
					dispatch.sideloadItem( id );
				} else {
					dispatch.uploadItem( id );
				}
				break;

			case OperationType.ThumbnailGeneration:
				dispatch.generateThumbnails( id );
				break;

			case OperationType.UploadOriginal:
				dispatch.uploadOriginal(
					id,
					operationArgs as OperationArgs[ OperationType.UploadOriginal ]
				);
				break;
		}
	};
}

/**
 * Resumes processing for a given post/attachment ID.
 *
 * @param postOrAttachmentId Post or attachment ID.
 */
export function resumeItem( postOrAttachmentId: number ) {
	return async ( { select, dispatch }: ThunkArgs ) => {
		const item = select.getPausedUploadForPost( postOrAttachmentId );
		if ( item ) {
			dispatch< ResumeItemAction >( {
				type: Type.ResumeItem,
				id: item.id,
			} );
			dispatch.processItem( item.id );
		}
	};
}

/**
 * Returns an action object that pauses all processing in the queue.
 *
 * Useful for testing purposes.
 *
 * @return Action object.
 */
export function pauseQueue(): PauseQueueAction {
	return {
		type: Type.PauseQueue,
	};
}

/**
 * Resumes all processing in the queue.
 *
 * Dispatches an action object for resuming the queue itself,
 * and triggers processing for each remaining item in the queue individually.
 */
export function resumeQueue() {
	return async ( { select, dispatch }: ThunkArgs ) => {
		dispatch< ResumeQueueAction >( {
			type: Type.ResumeQueue,
		} );

		for ( const item of select.getAllItems() ) {
			dispatch.processItem( item.id );
		}
	};
}

/**
 * Removes a specific item from the queue.
 *
 * @param id Item ID.
 */
export function removeItem( id: QueueItemId ) {
	return async ( { select, dispatch }: ThunkArgs ) => {
		const item = select.getItem( id );
		if ( ! item ) {
			return;
		}

		dispatch( {
			type: Type.Remove,
			id,
		} );
	};
}

/**
 * Finishes an operation for a given item ID and immediately triggers processing the next one.
 *
 * @param id      Item ID.
 * @param updates Updated item data.
 */
export function finishOperation(
	id: QueueItemId,
	updates: Partial< QueueItem >
) {
	return async ( { dispatch }: ThunkArgs ) => {
		dispatch< OperationFinishAction >( {
			type: Type.OperationFinish,
			id,
			item: updates,
		} );

		dispatch.processItem( id );
	};
}

/**
 * Prepares an item for initial processing.
 *
 * Determines the list of operations to perform for a given image,
 * depending on its media type.
 *
 * For example, HEIF images first need to be converted, resized,
 * compressed, and then uploaded.
 *
 * Or videos need to be compressed, and then need poster generation
 * before upload.
 *
 * @param id Item ID.
 */
export function prepareItem( id: QueueItemId ) {
	return async ( { select, dispatch, registry }: ThunkArgs ) => {
		const item = select.getItem( id ) as QueueItem;

		const { file } = item;

		const mediaType =
			'application/pdf' === file.type
				? 'pdf'
				: file.type.split( '/' )[ 0 ];

		const operations: Operation[] = [];

		switch ( mediaType ) {
			case 'image':
				// Short-circuit for file types such as SVG or ICO.
				if ( ! isImageTypeSupported( file.type ) ) {
					operations.push( OperationType.Upload );
					break;
				}

				const optimizeOnUpload: boolean = registry
					.select( preferencesStore )
					.get( PREFERENCES_NAME, 'optimizeOnUpload' );

				const imageSizeThreshold: number = registry
					.select( preferencesStore )
					.get( PREFERENCES_NAME, 'bigImageSizeThreshold' );

				if ( imageSizeThreshold ) {
					operations.push( [
						OperationType.ResizeCrop,
						{
							resize: {
								width: imageSizeThreshold,
								height: imageSizeThreshold,
							},
						},
					] );
				}

				if ( optimizeOnUpload ) {
					operations.push( OperationType.TranscodeImage );
				}

				operations.push( OperationType.GenerateMetadata );

				operations.push(
					OperationType.Upload,
					OperationType.ThumbnailGeneration
				);

				const keepOriginal: boolean = registry
					.select( preferencesStore )
					.get( PREFERENCES_NAME, 'keepOriginal' );

				if ( imageSizeThreshold && keepOriginal ) {
					operations.push( OperationType.UploadOriginal );
				}

				break;

			default:
				operations.push( OperationType.Upload );

				break;
		}

		dispatch< AddOperationsAction >( {
			type: Type.AddOperations,
			id,
			operations,
		} );

		dispatch.finishOperation( id, {} );
	};
}

/**
 * Adds thumbnail versions to the queue for sideloading.
 *
 * @param id Item ID.
 */
export function generateThumbnails( id: QueueItemId ) {
	return async ( { select, dispatch, registry }: ThunkArgs ) => {
		const item = select.getItem( id ) as QueueItem;

		const attachment: Attachment = item.attachment as Attachment;

		const thumbnailGeneration: ThumbnailGeneration = registry
			.select( preferencesStore )
			.get( PREFERENCES_NAME, 'thumbnailGeneration' );

		// Client-side thumbnail generation.
		// Works for images and PDF posters.

		if (
			! item.parentId &&
			attachment.missing_image_sizes &&
			'server' !== thumbnailGeneration
		) {
			let file = attachment.filename
				? renameFile( item.file, attachment.filename )
				: item.file;
			const batchId = uuidv4();

			if ( 'application/pdf' === item.file.type && item.poster ) {
				file = item.poster;

				const outputFormat: ImageFormat = registry
					.select( preferencesStore )
					.get( PREFERENCES_NAME, 'default_outputFormat' );

				const outputQuality: number = registry
					.select( preferencesStore )
					.get( PREFERENCES_NAME, 'default_quality' );

				const interlaced: boolean = registry
					.select( preferencesStore )
					.get( PREFERENCES_NAME, 'default_interlaced' );

				// Upload the "full" version without a resize param.
				dispatch.addSideloadItem( {
					file: item.poster,
					additionalData: {
						// Sideloading does not use the parent post ID but the
						// attachment ID as the image sizes need to be added to it.
						post: attachment.id,
						image_size: 'full',
						convert_format: false,
					},
					operations: [
						[
							OperationType.TranscodeImage,
							{ outputFormat, outputQuality, interlaced },
						],
						OperationType.Upload,
					],
					parentId: item.id,
				} );
			}

			for ( const name of attachment.missing_image_sizes ) {
				const imageSize = select.getImageSize( name );
				if ( ! imageSize ) {
					continue;
				}

				// Force thumbnails to be soft crops, see wp_generate_attachment_metadata().
				if (
					'application/pdf' === item.file.type &&
					'thumbnail' === name
				) {
					imageSize.crop = false;
				}

				dispatch.addSideloadItem( {
					file,
					onChange: ( [ updatedAttachment ] ) => {
						// If the sub-size is still being generated, there is no need
						// to invoke the callback below. It would just override
						// the main image in the editor with the sub-size.
						if ( isBlobURL( updatedAttachment.url ) ) {
							return;
						}

						// This might be confusing, but the idea is to update the original
						// image item in the editor with the new one with the added sub-size.
						item.onChange?.( [ updatedAttachment ] );
					},
					batchId,
					parentId: item.id,
					additionalData: {
						// Sideloading does not use the parent post ID but the
						// attachment ID as the image sizes need to be added to it.
						post: attachment.id,
						// Reference the same upload_request if needed.
						upload_request: item.additionalData.upload_request,
						image_size: name,
						convert_format: false,
					},
					operations: [
						[ OperationType.ResizeCrop, { resize: imageSize } ],
						OperationType.Upload,
					],
				} );
			}
		}

		dispatch.finishOperation( id, {} );
	};
}

type UploadOriginalArgs = OperationArgs[ OperationType.UploadOriginal ];

/**
 * Adds the original file to the queue for sideloading.
 *
 * If an item was downsized due to the big image size threshold,
 * this adds the original file for storing.
 *
 * @param id     Item ID.
 * @param [args] Additional arguments for the operation.
 */
export function uploadOriginal( id: QueueItemId, args?: UploadOriginalArgs ) {
	return async ( { select, dispatch }: ThunkArgs ) => {
		const item = select.getItem( id ) as QueueItem;

		const attachment: Attachment = item.attachment as Attachment;

		/*
		 Upload the original image file if it was resized because of the big image size threshold,
		 or if it was converted to be web-safe (e.g. HEIC, JPEG XL) and thus
		 uploading the original is "forced".
		*/
		if (
			! item.parentId &&
			( ( item.file instanceof ImageFile && item.file?.wasResized ) ||
				args?.force )
		) {
			const originalBaseName = getFileBasename(
				attachment.filename || item.file.name
			);

			dispatch.addSideloadItem( {
				file: renameFile(
					item.sourceFile,
					`${ originalBaseName }-original.${ getFileExtension(
						item.sourceFile.name
					) }`
				),
				parentId: item.id,
				additionalData: {
					// Sideloading does not use the parent post ID but the
					// attachment ID as the image sizes need to be added to it.
					post: attachment.id,
					// Reference the same upload_request if needed.
					upload_request: item.additionalData.upload_request,
					image_size: 'original',
					convert_format: false,
				},
				// Skip any resizing or optimization of the original image.
				operations: [ OperationType.Upload ],
			} );
		}

		dispatch.finishOperation( id, {} );
	};
}

type OptimizeImageItemArgs = OperationArgs[ OperationType.TranscodeImage ];

/**
 * Optimizes/Compresses an existing image item.
 *
 * @param id     Item ID.
 * @param [args] Additional arguments for the operation.
 */
export function optimizeImageItem(
	id: QueueItemId,
	args?: OptimizeImageItemArgs
) {
	return async ( { select, dispatch, registry }: ThunkArgs ) => {
		const item = select.getItem( id ) as QueueItem;

		const inputFormat = item.file.type.split( '/' )[ 1 ];

		const outputQuality: number =
			args?.outputQuality ||
			registry
				.select( preferencesStore )
				.get( PREFERENCES_NAME, `${ inputFormat }_quality` ) ||
			80;

		const interlaced: boolean =
			args?.interlaced ||
			registry
				.select( preferencesStore )
				.get( PREFERENCES_NAME, `${ inputFormat }_interlaced` ) ||
			false;

		try {
			let file: File;

			file = await vipsCompressImage(
				item.id,
				item.file,
				outputQuality / 100,
				interlaced
			);

			if ( item.file instanceof ImageFile ) {
				file = new ImageFile(
					file,
					item.file.width,
					item.file.height,
					item.file.originalWidth,
					item.file.originalHeight
				);
			}

			const blobUrl = createBlobURL( file );
			dispatch< CacheBlobUrlAction >( {
				type: Type.CacheBlobUrl,
				id,
				blobUrl,
			} );

			if ( args?.requireApproval ) {
				dispatch.finishOperation( id, {
					status: ItemStatus.PendingApproval,
					file,
					attachment: {
						url: blobUrl,
						mime_type: file.type,
					},
				} );
			} else {
				dispatch.finishOperation( id, {
					file,
					attachment: {
						url: blobUrl,
					},
				} );
			}
		} catch ( error ) {
			dispatch.cancelItem(
				id,
				new UploadError( {
					code: 'MEDIA_TRANSCODING_ERROR',
					message: 'File could not be uploaded',
					file: item.file,
					cause: error instanceof Error ? error : undefined,
				} )
			);
		}
	};
}

type ResizeCropItemArgs = OperationArgs[ OperationType.ResizeCrop ];

/**
 * Resizes and crops an existing image item.
 *
 * @param id     Item ID.
 * @param [args] Additional arguments for the operation.
 */
export function resizeCropItem( id: QueueItemId, args?: ResizeCropItemArgs ) {
	return async ( { select, dispatch, registry }: ThunkArgs ) => {
		const item = select.getItem( id ) as QueueItem;

		if ( ! args?.resize ) {
			dispatch.finishOperation( id, {
				file: item.file,
			} );
			return;
		}

		const thumbnailGeneration: ThumbnailGeneration = registry
			.select( preferencesStore )
			.get( PREFERENCES_NAME, 'thumbnailGeneration' );

		const smartCrop = Boolean( thumbnailGeneration === 'smart' );

		const addSuffix = Boolean( item.parentId );

		try {
			const file = await vipsResizeImage(
				item.id,
				item.file,
				args.resize,
				smartCrop,
				addSuffix
			);

			const blobUrl = createBlobURL( file );
			dispatch< CacheBlobUrlAction >( {
				type: Type.CacheBlobUrl,
				id,
				blobUrl,
			} );

			dispatch.finishOperation( id, {
				file,
				attachment: {
					url: blobUrl,
				},
			} );
		} catch ( error ) {
			dispatch.cancelItem(
				id,
				new UploadError( {
					code: 'IMAGE_TRANSCODING_ERROR',
					message: 'File could not be uploaded',
					file: item.file,
					cause: error instanceof Error ? error : undefined,
				} )
			);
		}
	};
}

/**
 * Uploads an item to the server.
 *
 * @param id Item ID.
 */
export function uploadItem( id: QueueItemId ) {
	return async ( { select, dispatch }: ThunkArgs ) => {
		const item = select.getItem( id ) as QueueItem;

		select.getSettings().mediaUpload( {
			filesList: [ item.file ],
			additionalData: item.additionalData,
			signal: item.abortController?.signal,
			onFileChange: ( [ attachment ] ) => {
				dispatch.finishOperation( id, {
					attachment,
				} );
			},
			onError: ( error ) => {
				dispatch.cancelItem( id, error );
			},
		} );
	};
}

/**
 * Sideloads an item to the server.
 *
 * @param id Item ID.
 */
export function sideloadItem( id: QueueItemId ) {
	return async ( { select, dispatch }: ThunkArgs ) => {
		const item = select.getItem( id ) as QueueItem;

		const { post, ...additionalData } =
			item.additionalData as SideloadAdditionalData;

		select.getSettings().mediaSideload( {
			file: item.file,
			attachmentId: post as number,
			additionalData,
			signal: item.abortController?.signal,
			onFileChange: ( [ attachment ] ) => {
				dispatch.finishOperation( id, { attachment } );
				dispatch.resumeItem( post as number );
			},
			onError: ( error ) => {
				dispatch.cancelItem( id, error );
				dispatch.resumeItem( post as number );
			},
		} );
	};
}

/**
 * Revokes all blob URLs for a given item, freeing up memory.
 *
 * @param id Item ID.
 */
export function revokeBlobUrls( id: QueueItemId ) {
	return async ( { select, dispatch }: ThunkArgs ) => {
		const blobUrls = select.getBlobUrls( id );

		for ( const blobUrl of blobUrls ) {
			revokeBlobURL( blobUrl );
		}

		dispatch< RevokeBlobUrlsAction >( {
			type: Type.RevokeBlobUrls,
			id,
		} );
	};
}
