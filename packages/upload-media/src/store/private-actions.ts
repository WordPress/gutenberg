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
import { cloneFile, convertBlobToFile } from '../utils';
import { StubFile } from '../stub-file';
import type {
	AddAction,
	AdditionalData,
	AddOperationsAction,
	BatchId,
	CacheBlobUrlAction,
	OnBatchSuccessHandler,
	OnChangeHandler,
	OnErrorHandler,
	OnSuccessHandler,
	Operation,
	OperationFinishAction,
	OperationStartAction,
	PauseQueueAction,
	QueueItem,
	QueueItemId,
	ResumeQueueAction,
	RevokeBlobUrlsAction,
	Settings,
	State,
	UpdateSettingsAction,
} from './types';
import { ItemStatus, OperationType, Type } from './types';
import type { cancelItem } from './actions';

type ActionCreators = {
	cancelItem: typeof cancelItem;
	addItem: typeof addItem;
	removeItem: typeof removeItem;
	prepareItem: typeof prepareItem;
	processItem: typeof processItem;
	finishOperation: typeof finishOperation;
	uploadItem: typeof uploadItem;
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

		const { attachment, onChange, onSuccess, onBatchSuccess, batchId } =
			item;

		const operation = Array.isArray( item.operations?.[ 0 ] )
			? item.operations[ 0 ][ 0 ]
			: item.operations?.[ 0 ];

		if ( attachment ) {
			onChange?.( [ attachment ] );
		}

		/*
		 If there are no more operations, the item can be removed from the queue,
		 but only if there are no thumbnails still being side-loaded,
		 or if itself is a side-loaded item.
		*/

		if ( ! operation ) {
			if ( attachment ) {
				onSuccess?.( [ attachment ] );
			}

			// dispatch.removeItem( id );
			dispatch.revokeBlobUrls( id );

			if ( batchId && select.isBatchUploaded( batchId ) ) {
				onBatchSuccess?.();
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

			case OperationType.Upload:
				dispatch.uploadItem( id );
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
	return async ( { dispatch }: ThunkArgs ) => {
		const operations: Operation[] = [ OperationType.Upload ];

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

		select.getSettings().mediaUpload( {
			filesList: [ item.file ],
			additionalData: item.additionalData,
			signal: item.abortController?.signal,
			onFileChange: ( [ attachment ] ) => {
				if ( ! isBlobURL( attachment.url ) ) {
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
