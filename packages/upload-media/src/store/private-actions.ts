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
import { canvasConvertToJpeg } from '../canvas-utils';
import { isClientSideMediaSupported } from '../feature-detection';
import { CLIENT_SIDE_SUPPORTED_MIME_TYPES, HEIC_MIME_TYPES } from './constants';
import { StubFile } from '../stub-file';
import { UploadError } from '../upload-error';
import {
	vipsResizeImage,
	vipsRotateImage,
	vipsConvertImageFormat,
	vipsHasTransparency,
	terminateVipsWorker,
} from './utils';
import type {
	AccumulateSubSizeAction,
	AddAction,
	AdditionalData,
	AddOperationsAction,
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
	ResumeQueueAction,
	RevokeBlobUrlsAction,
	SideloadAdditionalData,
	Settings,
	State,
	SubSizeData,
	UpdateProgressAction,
	UpdateSettingsAction,
} from './types';
import { ItemStatus, OperationType, Type } from './types';
import type { cancelItem } from './actions';

const DEFAULT_OUTPUT_QUALITY = 0.82;

type ActionCreators = {
	cancelItem: typeof cancelItem;
	addItem: typeof addItem;
	addSideloadItem: typeof addSideloadItem;
	removeItem: typeof removeItem;
	pauseItem: typeof pauseItem;
	prepareItem: typeof prepareItem;
	processItem: typeof processItem;
	finishOperation: typeof finishOperation;
	uploadItem: typeof uploadItem;
	sideloadItem: typeof sideloadItem;
	resizeCropItem: typeof resizeCropItem;
	rotateItem: typeof rotateItem;
	transcodeImageItem: typeof transcodeImageItem;
	generateThumbnails: typeof generateThumbnails;
	finalizeItem: typeof finalizeItem;
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
					generate_sub_sizes: false,
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
	return ( { dispatch }: ThunkArgs ) => {
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

		const item = select.getItem( id );
		if ( ! item ) {
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
		const operationArgs = Array.isArray( item.operations?.[ 0 ] )
			? item.operations[ 0 ][ 1 ]
			: undefined;

		/*
		 * If the next operation is an upload, check concurrency limit.
		 * If at capacity, the item remains queued and will be processed
		 * when another upload completes.
		 */
		if ( operation === OperationType.Upload ) {
			const settings = select.getSettings();
			const activeCount = select.getActiveUploadCount();
			if ( activeCount >= settings.maxConcurrentUploads ) {
				return;
			}
		}

		/*
		 * If the next operation is image processing (resize/crop/rotate),
		 * check the image processing concurrency limit.
		 * If at capacity, the item remains queued and will be processed
		 * when another image processing operation completes.
		 */
		if (
			operation === OperationType.ResizeCrop ||
			operation === OperationType.Rotate
		) {
			const settings = select.getSettings();
			const activeCount = select.getActiveImageProcessingCount();
			if ( activeCount >= settings.maxConcurrentImageProcessing ) {
				return;
			}
		}

		if ( attachment ) {
			// Don't update the block with a HEIC URL — the browser can't
			// display it.  The scaled JPEG sideload will call onChange
			// with a usable URL once the client-side conversion completes.
			const isHeicUrl =
				attachment.url && /\.hei[cf]$/i.test( attachment.url );
			if ( ! isHeicUrl ) {
				onChange?.( [ attachment ] );
			}
		}

		/*
		 If there are no more operations, the item can be removed from the queue,
		 but only if there are no thumbnails still being side-loaded,
		 or if itself is a side-loaded item.
		*/

		if ( ! operation ) {
			if (
				parentId ||
				( ! parentId && ! select.hasPendingItemsByParentId( id ) )
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
				if ( ! parentItem ) {
					return;
				}

				// If parent has pending operations (like Finalize), trigger them.
				if (
					parentItem.operations &&
					parentItem.operations.length > 0
				) {
					dispatch.processItem( parentId );
					return;
				}

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

		// For Finalize, wait until all child sideloads are complete.
		if (
			operation === OperationType.Finalize &&
			select.hasPendingItemsByParentId( id )
		) {
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

			case OperationType.Rotate:
				dispatch.rotateItem(
					item.id,
					operationArgs as OperationArgs[ OperationType.Rotate ]
				);
				break;

			case OperationType.TranscodeImage:
				dispatch.transcodeImageItem(
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

			case OperationType.Finalize:
				dispatch.finalizeItem( id );
				break;
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

		/*
		 * If the queue is now empty, terminate the VIPS worker to free
		 * WASM memory. The worker will be lazily re-created if needed.
		 */
		if ( select.getAllItems().length === 0 ) {
			terminateVipsWorker();
		}
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
			for ( const pendingItem of pendingUploads ) {
				dispatch.processItem( pendingItem.id );
			}
		}

		/*
		 * If an image processing operation just finished, there may be items
		 * waiting in the queue due to the image processing concurrency limit.
		 * Trigger processing for them.
		 */
		if (
			previousOperation === OperationType.ResizeCrop ||
			previousOperation === OperationType.Rotate
		) {
			const pendingItems = select.getPendingImageProcessing();
			for ( const pendingItem of pendingItems ) {
				dispatch.processItem( pendingItem.id );
			}
		}
	};
}

const VALID_IMAGE_FORMATS = [ 'jpeg', 'webp', 'avif', 'png', 'gif' ] as const;

/**
 * Checks if a format string is a valid ImageFormat.
 *
 * @param format The format string to validate.
 * @return Whether the format is valid.
 */
function isValidImageFormat( format: string ): format is ImageFormat {
	return VALID_IMAGE_FORMATS.includes( format as ImageFormat );
}

/**
 * Determines if an image should be transcoded to a different format.
 *
 * Handles PNG to JPEG conversion carefully by checking for transparency
 * to preserve the alpha channel when needed.
 *
 * @param file           The image file.
 * @param outputMimeType The target output MIME type.
 * @param interlaced     Whether to use interlaced encoding.
 * @return The transcode operation tuple if transcoding is needed, null otherwise.
 */
export async function getTranscodeImageOperation(
	file: File,
	outputMimeType: string,
	interlaced: boolean = false
): Promise<
	| [
			OperationType.TranscodeImage,
			OperationArgs[ OperationType.TranscodeImage ],
	  ]
	| null
> {
	// For PNG -> JPEG conversion, check if the image has transparency.
	// If it does, skip transcoding to preserve the alpha channel.
	if ( file.type === 'image/png' && outputMimeType === 'image/jpeg' ) {
		const blobUrl = createBlobURL( file );
		try {
			const hasAlpha = await vipsHasTransparency( blobUrl );
			if ( hasAlpha ) {
				// Image has transparency, skip conversion to JPEG.
				return null;
			}
		} catch {
			// If transparency check fails, err on the side of caution.
			return null;
		} finally {
			revokeBlobURL( blobUrl );
		}
	}

	const formatPart = outputMimeType.split( '/' )[ 1 ];
	if ( ! isValidImageFormat( formatPart ) ) {
		// Unknown format, skip transcoding.
		return null;
	}

	return [
		OperationType.TranscodeImage,
		{
			outputFormat: formatPart,
			outputQuality: DEFAULT_OUTPUT_QUALITY,
			interlaced,
		},
	];
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
		const item = select.getItem( id );
		if ( ! item ) {
			return;
		}
		const { file } = item;

		const operations: Operation[] = [];
		const settings = select.getSettings();
		let heicJpeg: File | null = null;

		const isImage = file.type.startsWith( 'image/' );
		const isVipsSupported = CLIENT_SIDE_SUPPORTED_MIME_TYPES.includes(
			file.type
		);
		const isHeic = HEIC_MIME_TYPES.includes( file.type );

		// For images that can be processed by vips, check if we need to scale down based on threshold.
		if ( isImage && isVipsSupported ) {
			const { bigImageSizeThreshold } = settings;

			// If a threshold is set, add a resize operation to scale down large images.
			// This matches WordPress core's behavior in wp_create_image_subsizes().
			if ( bigImageSizeThreshold ) {
				operations.push( [
					OperationType.ResizeCrop,
					{
						resize: {
							width: bigImageSizeThreshold,
							height: bigImageSizeThreshold,
						},
						isThresholdResize: true,
					},
				] );
			}

			// Main-file format conversion is handled server-side via the
			// image_editor_output_format filter during create_item.
			// The response carries image_output_format so generateThumbnails
			// can transcode sub-sizes to the same target format.

			operations.push(
				OperationType.Upload,
				OperationType.ThumbnailGeneration,
				OperationType.Finalize
			);
		} else if ( isImage && isHeic ) {
			// HEIC/HEIF: convert to JPEG client-side before upload.
			// The server may not support HEIC, so decode it using the
			// browser's native HEVC codec (createImageBitmap or VideoDecoder)
			// and upload the resulting JPEG. The server then handles it like
			// any normal JPEG (threshold scaling, sub-sizes, etc.).
			// This matches iOS behavior where HEIC is converted on the fly.
			try {
				heicJpeg = await canvasConvertToJpeg(
					file,
					settings.imageQuality ?? DEFAULT_OUTPUT_QUALITY
				);
			} catch {
				dispatch.cancelItem(
					id,
					new UploadError( {
						code: 'HEIC_DECODE_ERROR',
						message:
							'This browser cannot decode HEIC images and the server does not support them either. Please convert to JPEG before uploading.',
						file,
					} )
				);
				return;
			}

			operations.push(
				OperationType.Upload,
				OperationType.ThumbnailGeneration,
				OperationType.Finalize
			);
		} else {
			operations.push( OperationType.Upload );
		}

		dispatch< AddOperationsAction >( {
			type: Type.AddOperations,
			id,
			operations,
		} );

		// If the file is not processed by vips, tell the server to
		// generate sub-sizes since they won't be created client-side.
		let updates: Partial< QueueItem > = {};
		if ( isHeic && heicJpeg ) {
			// HEIC was converted to JPEG client-side. Upload the JPEG
			// and let the server handle it normally (threshold scaling,
			// sub-sizes, format conversion). Keep the original HEIC in
			// a separate field so it can be sideloaded as the "original"
			// after upload, preserving the user's file without leaking it
			// into paths that expect an editor-supported image.
			const vipsAvailable = isClientSideMediaSupported();
			updates = {
				file: heicJpeg,
				sourceFile: heicJpeg,
				originalHeicFile: item.file,
				additionalData: {
					...item.additionalData,
					generate_sub_sizes: ! vipsAvailable,
					convert_format: true,
				},
			};
		} else if ( ! isVipsSupported || ! isImage ) {
			updates = {
				additionalData: {
					...item.additionalData,
					generate_sub_sizes: true,
					convert_format: true,
				},
			};
		}

		dispatch.finishOperation( id, updates );
	};
}

/**
 * Uploads an item to the server.
 *
 * @param id Item ID.
 */
export function uploadItem( id: QueueItemId ) {
	return async ( { select, dispatch }: ThunkArgs ) => {
		const item = select.getItem( id );
		if ( ! item ) {
			return;
		}

		select.getSettings().mediaUpload( {
			filesList: [ item.file ],
			additionalData: item.additionalData,
			signal: item.abortController?.signal,
			onFileChange: ( [ attachment ] ) => {
				if ( attachment && ! isBlobURL( attachment.url ) ) {
					dispatch.finishOperation( id, {
						attachment,
					} );
				}
			},
			onSuccess: ( [ attachment ] ) => {
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
		const item = select.getItem( id );
		if ( ! item ) {
			return;
		}

		const { post, ...additionalData } =
			item.additionalData as SideloadAdditionalData;

		const mediaSideload = select.getSettings().mediaSideload;
		if ( ! mediaSideload ) {
			// If sideloading is not supported, skip this operation.
			dispatch.finishOperation( id, {} );
			return;
		}

		mediaSideload( {
			file: item.file,
			attachmentId: post as number,
			additionalData,
			signal: item.abortController?.signal,
			onSuccess: ( subSize: SubSizeData ) => {
				// Accumulate sub-size data on the parent item for finalize.
				if ( item.parentId ) {
					dispatch< AccumulateSubSizeAction >( {
						type: Type.AccumulateSubSize,
						id: item.parentId,
						subSize,
					} );
				}
				dispatch.finishOperation( id, {} );
			},
			onError: ( error ) => {
				dispatch.cancelItem( id, error );
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
		const item = select.getItem( id );
		if ( ! item ) {
			return;
		}

		if ( ! args?.resize ) {
			dispatch.finishOperation( id, {
				file: item.file,
			} );
			return;
		}

		// Add dimension suffix for sub-sizes (thumbnails).
		const addSuffix = Boolean( item.parentId );
		// Add '-scaled' suffix for big image threshold resizing.
		const scaledSuffix = Boolean( args.isThresholdResize );

		try {
			const file = await vipsResizeImage(
				item.id,
				item.file,
				args.resize,
				false, // smartCrop
				addSuffix,
				item.abortController?.signal,
				scaledSuffix
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

type RotateItemArgs = OperationArgs[ OperationType.Rotate ];

/**
 * Rotates an image based on EXIF orientation.
 *
 * This is used for images that need rotation but don't need resizing
 * (i.e., smaller than the big image size threshold).
 * Matches WordPress core's behavior of creating a '-rotated' version.
 *
 * @param id     Item ID.
 * @param [args] Rotation arguments including EXIF orientation value.
 */
export function rotateItem( id: QueueItemId, args?: RotateItemArgs ) {
	return async ( { select, dispatch }: ThunkArgs ) => {
		const item = select.getItem( id );
		if ( ! item ) {
			return;
		}

		// If no orientation provided or orientation is 1 (normal), skip rotation.
		if ( ! args?.orientation || args.orientation === 1 ) {
			dispatch.finishOperation( id, {
				file: item.file,
			} );
			return;
		}

		try {
			const file = await vipsRotateImage(
				item.id,
				item.file,
				args.orientation,
				item.abortController?.signal
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
					code: 'IMAGE_ROTATION_ERROR',
					message: 'Image could not be rotated',
					file: item.file,
					cause: error instanceof Error ? error : undefined,
				} )
			);
		}
	};
}

type TranscodeImageItemArgs = OperationArgs[ OperationType.TranscodeImage ];

/**
 * Transcodes an image to a different format.
 *
 * This operation converts images between formats (e.g., PNG to WebP, JPEG to AVIF)
 * based on the WordPress image_editor_output_format filter settings.
 *
 * @param id     Item ID.
 * @param [args] Transcode arguments including output format, quality, and interlace settings.
 */
export function transcodeImageItem(
	id: QueueItemId,
	args?: TranscodeImageItemArgs
) {
	return async ( { select, dispatch }: ThunkArgs ) => {
		const item = select.getItem( id );
		if ( ! item ) {
			return;
		}

		// If no output format specified, skip transcoding.
		if ( ! args?.outputFormat ) {
			dispatch.finishOperation( id, {
				file: item.file,
			} );
			return;
		}

		const outputMimeType = `image/${ args.outputFormat }` as
			| 'image/jpeg'
			| 'image/png'
			| 'image/webp'
			| 'image/avif'
			| 'image/gif';
		const quality = args.outputQuality ?? DEFAULT_OUTPUT_QUALITY;
		const interlaced = args.interlaced ?? false;

		try {
			const file = await vipsConvertImageFormat(
				item.id,
				item.file,
				outputMimeType,
				quality,
				interlaced
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
					code: 'MEDIA_TRANSCODING_ERROR',
					message:
						'Image could not be transcoded to the target format',
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
 * Also handles image rotation for images that need EXIF-based rotation
 * but weren't scaled down (and thus weren't auto-rotated by vips).
 *
 * @param id Item ID.
 */
export function generateThumbnails( id: QueueItemId ) {
	return async ( { select, dispatch }: ThunkArgs ) => {
		const item = select.getItem( id );
		if ( ! item ) {
			return;
		}

		if ( ! item.attachment ) {
			dispatch.finishOperation( id, {} );
			return;
		}
		const attachment = item.attachment;
		const settings = select.getSettings();

		// HEIC/HEIF: preserve the original file under a dedicated metadata
		// key so it never collides with `original_image`, which the scaled
		// sideload flow owns. The HEIC was kept on item.originalHeicFile;
		// the uploaded file is a JPEG conversion. parentId guarantees
		// processItem routes this to the sideload endpoint, never the main
		// create endpoint.
		if ( item.originalHeicFile && attachment.id ) {
			dispatch.addSideloadItem( {
				file: item.originalHeicFile,
				batchId: uuidv4(),
				parentId: item.id,
				additionalData: {
					post: attachment.id,
					image_size: 'original-heic',
					convert_format: false,
				},
				operations: [ OperationType.Upload ],
			} );
		}

		// Check if image needs rotation.
		// If exif_orientation is not 1, the image needs rotation.
		// Images that were scaled (bigImageSizeThreshold) are already rotated by vips.
		{
			const needsRotation =
				attachment.exif_orientation &&
				attachment.exif_orientation !== 1 &&
				! item.file.name.includes( '-scaled' );

			// If rotation is needed for a non-scaled image, sideload the rotated version.
			// This matches WordPress core's behavior of creating a -rotated version.
			if ( needsRotation && attachment.id ) {
				try {
					const rotatedFile = await vipsRotateImage(
						item.id,
						item.sourceFile,
						attachment.exif_orientation as number,
						item.abortController?.signal
					);

					// Sideload the rotated file as the "original" to set original_image metadata.
					// The server will store this in $metadata['original_image'].
					dispatch.addSideloadItem( {
						file: rotatedFile,
						batchId: uuidv4(),
						parentId: item.id,
						additionalData: {
							post: attachment.id,
							image_size: 'original',
							convert_format: false,
						},
						operations: [ OperationType.Upload ],
					} );
				} catch {
					// If rotation fails, continue with thumbnail generation.
					// Thumbnails will still be rotated correctly by vips.
					// eslint-disable-next-line no-console
					console.warn(
						'Failed to rotate image, continuing with thumbnails'
					);
				}
			}
		}

		// Client-side thumbnail generation for images.
		if (
			! item.parentId &&
			attachment.missing_image_sizes &&
			attachment.missing_image_sizes.length > 0
		) {
			const allImageSizes = settings.allImageSizes || {};
			const sizesToGenerate: string[] =
				attachment.missing_image_sizes as string[];

			const thumbnailSource = item.sourceFile;
			const file = attachment.filename
				? renameFile( thumbnailSource, attachment.filename )
				: thumbnailSource;
			const batchId = uuidv4();

			// Read per-file format conversion data from the attachment response.
			const outputMimeType = attachment.image_output_format;
			const interlaced = attachment.image_save_progressive ?? false;

			// Check if thumbnails should be transcoded to a different format.
			// Uses the same transparency-aware logic as the main image
			// to avoid converting transparent PNGs to JPEG.
			let thumbnailTranscodeOperation:
				| [
						OperationType.TranscodeImage,
						OperationArgs[ OperationType.TranscodeImage ],
				  ]
				| null = null;

			if ( outputMimeType ) {
				thumbnailTranscodeOperation = await getTranscodeImageOperation(
					thumbnailSource,
					outputMimeType,
					interlaced
				);
			}

			// Group sizes by dimensions to avoid creating duplicate files.
			// When multiple size names have the same width/height/crop,
			// only one physical file is generated and registered under
			// all matching size names via a single sideload request.
			const dimensionGroups = new Map< string, string[] >();
			for ( const name of sizesToGenerate ) {
				const imageSize = allImageSizes[ name ];
				if ( ! imageSize ) {
					// eslint-disable-next-line no-console
					console.warn(
						`Image size "${ name }" not found in configuration`
					);
					continue;
				}
				const key = `${ imageSize.width }x${ imageSize.height }x${ imageSize.crop }`;
				const group = dimensionGroups.get( key );
				if ( group ) {
					group.push( name );
				} else {
					dimensionGroups.set( key, [ name ] );
				}
			}

			for ( const [ , names ] of dimensionGroups ) {
				const imageSize = allImageSizes[ names[ 0 ] ];

				// Build operations list for this thumbnail.
				const thumbnailOperations: Operation[] = [
					[ OperationType.ResizeCrop, { resize: imageSize } ],
				];

				// Add transcoding if format conversion is configured and
				// the transparency check passed.
				if ( thumbnailTranscodeOperation ) {
					thumbnailOperations.push( thumbnailTranscodeOperation );
				}

				thumbnailOperations.push( OperationType.Upload );

				// Pass all size names so the server registers the same
				// file under every matching size name in metadata.
				const imageSizeParam = names.length === 1 ? names[ 0 ] : names;

				dispatch.addSideloadItem( {
					file,
					batchId,
					parentId: item.id,
					additionalData: {
						// Sideloading does not use the parent post ID but the
						// attachment ID as the image sizes need to be added to it.
						post: attachment.id,
						image_size: imageSizeParam,
						convert_format: false,
					},
					operations: thumbnailOperations,
				} );
			}

			// Create and sideload the scaled version if it exceeds the threshold.
			{
				const { bigImageSizeThreshold } = settings;
				if ( bigImageSizeThreshold && attachment.id ) {
					// Check if the image actually exceeds the threshold.
					// Only create a scaled version for images larger than the threshold,
					// matching WordPress core's wp_create_image_subsizes() behavior.
					const bitmap = await createImageBitmap( thumbnailSource );
					const needsScaling =
						bitmap.width > bigImageSizeThreshold ||
						bitmap.height > bigImageSizeThreshold;
					bitmap.close();

					if ( needsScaling ) {
						// Rename sourceFile to match the server attachment filename.
						const sourceForScaled = attachment.filename
							? renameFile( thumbnailSource, attachment.filename )
							: thumbnailSource;

						// Add scaling to queue.
						const scaledOperations: Operation[] = [
							[
								OperationType.ResizeCrop,
								{
									resize: {
										width: bigImageSizeThreshold,
										height: bigImageSizeThreshold,
									},
									isThresholdResize: true,
								},
							],
						];

						// Add transcoding if format conversion is configured.
						if ( thumbnailTranscodeOperation ) {
							scaledOperations.push(
								thumbnailTranscodeOperation
							);
						}

						scaledOperations.push( OperationType.Upload );

						dispatch.addSideloadItem( {
							file: sourceForScaled,
							batchId,
							parentId: item.id,
							additionalData: {
								post: attachment.id,
								image_size: 'scaled',
								convert_format: false,
							},
							operations: scaledOperations,
						} );
					}
				}
			}
		}

		dispatch.finishOperation( id, {} );
	};
}

/**
 * Finalizes an uploaded item by calling the server's finalize endpoint.
 *
 * This triggers the wp_generate_attachment_metadata filter so that PHP
 * plugins can process the attachment after all client-side operations
 * (including thumbnail sideloads) are complete.
 *
 * @param id Item ID.
 */
export function finalizeItem( id: QueueItemId ) {
	return async ( { select, dispatch }: ThunkArgs ) => {
		const item = select.getItem( id );
		if ( ! item ) {
			return;
		}

		const attachment = item.attachment;
		const { mediaFinalize } = select.getSettings();

		// Only finalize if we have an attachment ID and a mediaFinalize callback.
		if ( attachment?.id && mediaFinalize ) {
			try {
				await mediaFinalize( attachment.id, item.subSizes || [] );
			} catch ( error ) {
				// Log but don't fail the upload if finalization fails.
				// eslint-disable-next-line no-console
				console.warn( 'Media finalization failed:', error );
			}
		}

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
 * Returns an action object that updates the store settings.
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
