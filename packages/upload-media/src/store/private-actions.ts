/**
 * External dependencies
 */
import { v4 as uuidv4 } from 'uuid';

/**
 * WordPress dependencies
 */
import { createBlobURL, isBlobURL, revokeBlobURL } from '@wordpress/blob';
import type { createRegistry } from '@wordpress/data';

type WPDataRegistry = ReturnType< typeof createRegistry >;

/**
 * Internal dependencies
 */
import { cloneFile, convertBlobToFile, renameFile } from '../utils';
import { StubFile } from '../stub-file';
import { UploadError } from '../upload-error';
import { vipsResizeImage, debug } from './utils';
import type {
	AddAction,
	AdditionalData,
	AddOperationsAction,
	Attachment,
	BatchId,
	CacheBlobUrlAction,
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
	Settings,
	State,
	UpdateProgressAction,
	UpdateSettingsAction,
} from './types';
import { ItemStatus, OperationType, Type } from './types';
import type { cancelItem } from './actions';

type ActionCreators = {
	cancelItem: typeof cancelItem;
	addItem: typeof addItem;
	addSideloadItem: typeof addSideloadItem;
	removeItem: typeof removeItem;
	pauseItem: typeof pauseItem;
	resumeItem: typeof resumeItem;
	prepareItem: typeof prepareItem;
	processItem: typeof processItem;
	finishOperation: typeof finishOperation;
	uploadItem: typeof uploadItem;
	sideloadItem: typeof sideloadItem;
	resizeCropItem: typeof resizeCropItem;
	generateThumbnails: typeof generateThumbnails;
	updateItemProgress: typeof updateItemProgress;
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
	return async ( { dispatch }: ThunkArgs ) => {
		const itemId = uuidv4();

		debug.group( `addItem: ${ itemId }` );
		debug.log( 'Adding new item to queue', {
			itemId,
			batchId,
			sourceUrl,
			sourceAttachmentId,
			operations,
			additionalData,
		} );
		debug.log( 'File details:', fileOrBlob );

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

		debug.log( 'Dispatching Add action with operations:', {
			operations: Array.isArray( operations )
				? operations
				: [ OperationType.Prepare ],
		} );

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
					generate_sub_sizes: false,
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

		debug.log( 'Starting item processing' );
		debug.groupEnd();
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
 * This is typically a client-side generated thumbnail.
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
	return async ( { dispatch }: ThunkArgs ) => {
		const itemId = uuidv4();

		debug.group( `addSideloadItem: ${ itemId }` );
		debug.log( 'Adding sideload item (thumbnail)', {
			itemId,
			batchId,
			parentId,
			additionalData,
		} );
		debug.log( 'File details:', file );
		debug.log( 'Operations:', operations );

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

		debug.log( 'Sideload item added, starting processing' );
		debug.groupEnd();
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
		debug.group( `processItem: ${ id }` );

		if ( select.isPaused() ) {
			debug.log( 'Queue is paused, skipping' );
			debug.groupEnd();
			return;
		}

		const item = select.getItem( id ) as QueueItem;

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
		const operationArgs = Array.isArray( item.operations?.[ 0 ] )
			? item.operations[ 0 ][ 1 ]
			: undefined;

		debug.log( 'Processing item', {
			id,
			status: item.status,
			parentId,
			batchId,
			currentOperation: operation,
			operationArgs,
			remainingOperations: item.operations,
			file: item.file,
		} );

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
				debug.log(
					'Pausing sideload item - parent is still uploading',
					{
						parentId: item.parentId,
						post: item.additionalData.post,
					}
				);
				debug.groupEnd();
				dispatch< PauseItemAction >( {
					type: Type.PauseItem,
					id,
				} );
				return;
			}
		}

		/*
		 * If the next operation is an upload, check concurrency limit.
		 * If at capacity, the item remains queued and will be processed
		 * when another upload completes.
		 */
		if ( operation === OperationType.Upload ) {
			const settings = select.getSettings();
			const activeCount = select.getActiveUploadCount();
			if ( activeCount >= settings.maxConcurrentUploads ) {
				debug.log( 'Concurrency limit reached, waiting', {
					activeCount,
					maxConcurrentUploads: settings.maxConcurrentUploads,
				} );
				debug.groupEnd();
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
			debug.log( 'No more operations for item', { id, parentId } );

			if (
				parentId ||
				( ! parentId && ! select.isUploadingByParentId( id ) )
			) {
				debug.log( 'Item complete, removing from queue', {
					id,
					hasAttachment: !! attachment,
					attachmentId: attachment?.id,
				} );

				if ( attachment ) {
					onSuccess?.( [ attachment ] );
				}

				dispatch.removeItem( id );
				dispatch.revokeBlobUrls( id );

				if ( batchId && select.isBatchUploaded( batchId ) ) {
					debug.log( 'Batch complete', { batchId } );
					onBatchSuccess?.();
				}
			}

			// All other side-loaded items have been removed, so remove the parent too.
			if ( parentId && batchId && select.isBatchUploaded( batchId ) ) {
				const parentItem = select.getItem( parentId ) as QueueItem;
				if ( ! parentItem ) {
					debug.log( 'Parent item not found', { parentId } );
					debug.groupEnd();
					return;
				}

				debug.log(
					'Removing parent item after all sideloads complete',
					{
						parentId,
					}
				);

				if ( attachment ) {
					parentItem.onSuccess?.( [ attachment ] );
				}

				dispatch.removeItem( parentId );
				dispatch.revokeBlobUrls( parentId );

				if (
					parentItem.batchId &&
					select.isBatchUploaded( parentItem.batchId )
				) {
					debug.log( 'Parent batch complete', {
						batchId: parentItem.batchId,
					} );
					parentItem.onBatchSuccess?.();
				}
			}

			/*
			 At this point we are dealing with a parent whose children haven't fully uploaded yet.
			 Do nothing and let the removal happen once the last side-loaded item finishes.
			 */
			debug.groupEnd();
			return;
		}

		debug.log( `Starting operation: ${ operation }`, {
			id,
			operationArgs,
		} );

		dispatch< OperationStartAction >( {
			type: Type.OperationStart,
			id,
			operation,
		} );

		switch ( operation ) {
			case OperationType.Prepare:
				debug.log( 'Dispatching prepareItem' );
				dispatch.prepareItem( item.id );
				break;

			case OperationType.ResizeCrop:
				debug.log( 'Dispatching resizeCropItem', { operationArgs } );
				dispatch.resizeCropItem(
					item.id,
					operationArgs as OperationArgs[ OperationType.ResizeCrop ]
				);
				break;

			case OperationType.Upload:
				if ( item.parentId ) {
					debug.log( 'Dispatching sideloadItem (has parentId)' );
					dispatch.sideloadItem( id );
				} else {
					debug.log( 'Dispatching uploadItem (no parentId)' );
					dispatch.uploadItem( id );
				}
				break;

			case OperationType.ThumbnailGeneration:
				debug.log( 'Dispatching generateThumbnails' );
				dispatch.generateThumbnails( id );
				break;
		}

		debug.groupEnd();
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
 * Pauses a specific item in the queue.
 *
 * @param id Item ID.
 */
export function pauseItem( id: QueueItemId ) {
	return async ( { dispatch }: ThunkArgs ) => {
		dispatch< PauseItemAction >( {
			type: Type.PauseItem,
			id,
		} );
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
	return async ( { select, dispatch }: ThunkArgs ) => {
		const item = select.getItem( id );
		const previousOperation = item?.currentOperation;

		debug.log( `finishOperation: ${ id }`, {
			previousOperation,
			updates: {
				...updates,
				attachment: updates.attachment
					? {
							id: updates.attachment.id,
							url: updates.attachment.url,
							missing_image_sizes:
								updates.attachment.missing_image_sizes,
					  }
					: undefined,
			},
		} );

		dispatch< OperationFinishAction >( {
			type: Type.OperationFinish,
			id,
			item: updates,
		} );

		dispatch.processItem( id );

		/*
		 * If an upload just finished, there may be items waiting in the queue
		 * due to concurrency limits. Trigger processing for them.
		 */
		if ( previousOperation === OperationType.Upload ) {
			const pendingUploads = select.getPendingUploads();
			debug.log( 'Upload finished, processing pending uploads', {
				pendingCount: pendingUploads.length,
			} );
			for ( const pendingItem of pendingUploads ) {
				dispatch.processItem( pendingItem.id );
			}
		}
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
	return async ( { select, dispatch }: ThunkArgs ) => {
		const item = select.getItem( id ) as QueueItem;
		const { file } = item;

		debug.group( `prepareItem: ${ id }` );
		debug.log( 'Preparing item', { file } );

		const operations: Operation[] = [];

		const isImage = file.type.startsWith( 'image/' );

		// For images, add upload and thumbnail generation.
		if ( isImage ) {
			debug.log(
				'Image detected, adding Upload and ThumbnailGeneration operations'
			);
			operations.push(
				OperationType.Upload,
				OperationType.ThumbnailGeneration
			);
		} else {
			debug.log( 'Non-image file, adding Upload operation only' );
			operations.push( OperationType.Upload );
		}

		debug.log( 'Operations to perform:', operations );
		debug.groupEnd();

		dispatch< AddOperationsAction >( {
			type: Type.AddOperations,
			id,
			operations,
		} );

		dispatch.finishOperation( id, {} );
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

		debug.group( `uploadItem: ${ id }` );
		debug.log( 'Starting upload', {
			file: item.file,
			additionalData: item.additionalData,
		} );
		debug.time( `upload-${ id }` );

		select.getSettings().mediaUpload( {
			filesList: [ item.file ],
			additionalData: item.additionalData,
			signal: item.abortController?.signal,
			onFileChange: ( [ attachment ] ) => {
				debug.log( 'Upload onFileChange', {
					id,
					attachmentId: attachment.id,
					url: attachment.url,
					isBlobUrl: isBlobURL( attachment.url ),
					missing_image_sizes: attachment.missing_image_sizes,
				} );
				if ( ! isBlobURL( attachment.url ) ) {
					dispatch.finishOperation( id, {
						attachment,
					} );
				}
			},
			onSuccess: ( [ attachment ] ) => {
				debug.timeEnd( `upload-${ id }` );
				debug.log( 'Upload onSuccess', {
					id,
					attachmentId: attachment.id,
					url: attachment.url,
					missing_image_sizes: attachment.missing_image_sizes,
				} );
				debug.groupEnd();
				dispatch.finishOperation( id, {
					attachment,
				} );
			},
			onError: ( error ) => {
				debug.timeEnd( `upload-${ id }` );
				debug.error( 'Upload failed', { id, error: error.message } );
				debug.groupEnd();
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

		debug.group( `sideloadItem: ${ id }` );
		debug.log( 'Starting sideload (thumbnail upload)', {
			file: item.file,
			attachmentId: post,
			image_size: additionalData.image_size,
			parentId: item.parentId,
		} );
		debug.time( `sideload-${ id }` );

		const mediaSideload = select.getSettings().mediaSideload;
		if ( ! mediaSideload ) {
			debug.warn( 'Sideloading not supported, skipping' );
			debug.groupEnd();
			// If sideloading is not supported, skip this operation.
			dispatch.finishOperation( id, {} );
			return;
		}

		mediaSideload( {
			file: item.file,
			attachmentId: post as number,
			additionalData,
			signal: item.abortController?.signal,
			onFileChange: ( [ attachment ] ) => {
				debug.timeEnd( `sideload-${ id }` );
				debug.log( 'Sideload complete', {
					id,
					attachmentId: attachment.id,
					image_size: additionalData.image_size,
				} );
				debug.groupEnd();
				dispatch.finishOperation( id, { attachment } );
				dispatch.resumeItem( post as number );
			},
			onError: ( error ) => {
				debug.timeEnd( `sideload-${ id }` );
				debug.error( 'Sideload failed', {
					id,
					error: error.message,
					image_size: additionalData.image_size,
				} );
				debug.groupEnd();
				dispatch.cancelItem( id, error );
				dispatch.resumeItem( post as number );
			},
		} );
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
	return async ( { select, dispatch }: ThunkArgs ) => {
		const item = select.getItem( id ) as QueueItem;

		debug.group( `resizeCropItem: ${ id }` );
		debug.log( 'Resizing/cropping image for thumbnail', {
			file: item.file,
			resize: args?.resize,
			parentId: item.parentId,
		} );

		if ( ! args?.resize ) {
			debug.log( 'No resize args provided, skipping resize' );
			debug.groupEnd();
			dispatch.finishOperation( id, {
				file: item.file,
			} );
			return;
		}

		const addSuffix = Boolean( item.parentId );

		debug.log( 'Resize parameters', {
			width: args.resize.width,
			height: args.resize.height,
			crop: args.resize.crop,
			addSuffix,
		} );
		debug.time( `resize-${ id }` );

		try {
			const file = await vipsResizeImage(
				item.id,
				item.file,
				args.resize,
				false, // smartCrop
				addSuffix
			);

			debug.timeEnd( `resize-${ id }` );
			debug.log( 'Resize complete', {
				originalFile: item.file,
				resizedFile: file,
				dimensions: {
					width: file.width,
					height: file.height,
					originalWidth: file.originalWidth,
					originalHeight: file.originalHeight,
				},
			} );
			debug.groupEnd();

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
			debug.timeEnd( `resize-${ id }` );
			debug.error( 'Resize failed', {
				id,
				error: error instanceof Error ? error.message : error,
			} );
			debug.groupEnd();
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
 * Adds thumbnail versions to the queue for sideloading.
 *
 * @param id Item ID.
 */
export function generateThumbnails( id: QueueItemId ) {
	return async ( { select, dispatch }: ThunkArgs ) => {
		const item = select.getItem( id ) as QueueItem;

		const attachment: Attachment = item.attachment as Attachment;

		debug.group( `generateThumbnails: ${ id }` );
		debug.log( 'Starting thumbnail generation', {
			attachmentId: attachment?.id,
			parentId: item.parentId,
			missing_image_sizes: attachment?.missing_image_sizes,
			file: item.file,
		} );

		// Client-side thumbnail generation for images.
		if (
			! item.parentId &&
			attachment.missing_image_sizes &&
			attachment.missing_image_sizes.length > 0
		) {
			const file = attachment.media_filename
				? renameFile( item.file, attachment.media_filename )
				: item.file;
			const batchId = uuidv4();

			debug.log( 'Creating thumbnails for missing sizes', {
				missingSizes: attachment.missing_image_sizes,
				thumbnailBatchId: batchId,
				file,
			} );

			// Get all registered image sizes from settings.
			const allImageSizes = select.getSettings().allImageSizes || {};

			for ( const name of attachment.missing_image_sizes ) {
				const imageSize =
					allImageSizes?.[ name as keyof typeof allImageSizes ];
				if ( ! imageSize ) {
					debug.warn(
						`Image size "${ name }" not found in settings, skipping`
					);
					continue;
				}

				debug.log( `Creating thumbnail: ${ name }`, {
					sizeName: name,
					dimensions: {
						width: imageSize.width,
						height: imageSize.height,
						crop: imageSize.crop,
					},
					attachmentId: attachment.id,
				} );

				dispatch.addSideloadItem( {
					file,
					onChange: ( [ updatedAttachment ] ) => {
						// If the sub-size is still being generated, there is no need
						// to invoke the callback below. It would just override
						// the main image in the editor with the sub-size.
						if ( isBlobURL( updatedAttachment.url ) ) {
							return;
						}

						debug.log( `Thumbnail "${ name }" onChange callback`, {
							attachmentId: updatedAttachment.id,
						} );

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
						image_size: name,
						convert_format: false,
					},
					operations: [
						[ OperationType.ResizeCrop, { resize: imageSize } ],
						OperationType.Upload,
					],
				} );
			}

			debug.log(
				`Queued ${ attachment.missing_image_sizes.length } thumbnails for generation`
			);
		} else {
			debug.log( 'No thumbnails to generate', {
				hasParentId: !! item.parentId,
				hasMissingSizes: !! attachment?.missing_image_sizes,
				missingSizesCount: attachment?.missing_image_sizes?.length || 0,
			} );
		}

		debug.groupEnd();
		dispatch.finishOperation( id, {} );
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

/**
 * Updates the progress of an item.
 *
 * @param id       Item ID.
 * @param progress Progress value (0-100).
 */
export function updateItemProgress( id: QueueItemId, progress: number ) {
	return async ( { dispatch }: ThunkArgs ) => {
		dispatch< UpdateProgressAction >( {
			type: Type.UpdateProgress,
			id,
			progress,
		} );
	};
}

/**
 * Returns an action object that pauses all processing in the queue.
 *
 * Useful for testing purposes.
 *
 * @param settings
 * @return Action object.
 */
export function updateSettings(
	settings: Partial< Settings >
): UpdateSettingsAction {
	return {
		type: Type.UpdateSettings,
		settings,
	};
}
