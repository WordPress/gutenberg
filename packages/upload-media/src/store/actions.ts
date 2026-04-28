/**
 * External dependencies
 */
import { v4 as uuidv4 } from 'uuid';

/**
 * WordPress dependencies
 */
import type { createRegistry } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

type WPDataRegistry = ReturnType< typeof createRegistry >;

/**
 * Internal dependencies
 */
import type {
	AdditionalData,
	CancelAction,
	OnBatchSuccessHandler,
	OnChangeHandler,
	OnErrorHandler,
	OnSuccessHandler,
	QueueItemId,
	RetryItemAction,
	State,
} from './types';
import { OperationType, Type } from './types';
import type {
	addItem,
	processItem,
	removeItem,
	revokeBlobUrls,
} from './private-actions';
import { vipsCancelOperations } from './utils';
import { UploadError } from '../upload-error';
import { validateMimeType } from '../validate-mime-type';
import { validateMimeTypeForUser } from '../validate-mime-type-for-user';
import { validateFileSize } from '../validate-file-size';

type ActionCreators = {
	addItem: typeof addItem;
	addItems: typeof addItems;
	removeItem: typeof removeItem;
	processItem: typeof processItem;
	cancelItem: typeof cancelItem;
	retryItem: typeof retryItem;
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

interface AddItemsArgs {
	files: File[];
	onChange?: OnChangeHandler;
	onSuccess?: OnSuccessHandler;
	onBatchSuccess?: OnBatchSuccessHandler;
	onError?: OnErrorHandler;
	additionalData?: AdditionalData;
	allowedTypes?: string[];
}

/**
 * Adds a new item to the upload queue.
 *
 * @param $0
 * @param $0.files            Files
 * @param [$0.onChange]       Function called each time a file or a temporary representation of the file is available.
 * @param [$0.onSuccess]      Function called after the file is uploaded.
 * @param [$0.onBatchSuccess] Function called after a batch of files is uploaded.
 * @param [$0.onError]        Function called when an error happens.
 * @param [$0.additionalData] Additional data to include in the request.
 * @param [$0.allowedTypes]   Array with the types of media that can be uploaded, if unset all types are allowed.
 */
export function addItems( {
	files,
	onChange,
	onSuccess,
	onError,
	onBatchSuccess,
	additionalData,
	allowedTypes,
}: AddItemsArgs ) {
	return async ( { select, dispatch }: ThunkArgs ) => {
		const batchId = uuidv4();
		for ( const file of files ) {
			/*
			 Check if the caller (e.g. a block) supports this mime type.
			 Special case for file types such as HEIC which will be converted before upload anyway.
			 Another check will be done before upload.
			*/
			try {
				validateMimeType( file, allowedTypes );
				validateMimeTypeForUser(
					file,
					select.getSettings().allowedMimeTypes
				);
			} catch ( error: unknown ) {
				onError?.( error as Error );
				continue;
			}

			try {
				validateFileSize(
					file,
					select.getSettings().maxUploadFileSize
				);
			} catch ( error: unknown ) {
				onError?.( error as Error );
				continue;
			}

			dispatch.addItem( {
				file,
				batchId,
				onChange,
				onSuccess,
				onBatchSuccess,
				onError,
				additionalData,
			} );
		}
	};
}

/**
 * Cancels an item in the queue based on an error.
 *
 * @param id     Item ID.
 * @param error  Error instance.
 * @param silent Whether to cancel the item silently,
 *               without invoking its `onError` callback.
 */
export function cancelItem( id: QueueItemId, error: Error, silent = false ) {
	return async ( { select, dispatch }: ThunkArgs ) => {
		const item = select.getItem( id );

		if ( ! item ) {
			/*
			 * Do nothing if item has already been removed.
			 * This can happen if an upload is cancelled manually
			 * while transcoding with vips is still in progress.
			 * Then, cancelItem() is once invoked manually and once
			 * by the error handler in optimizeImageItem().
			 */
			return;
		}

		item.abortController?.abort();

		// Cancel any ongoing vips operations for this item.
		await vipsCancelOperations( id );

		if ( ! silent ) {
			const { onError } = item;
			onError?.( error ?? new Error( 'Upload cancelled' ) );
			if ( ! onError && error && ! item.parentId ) {
				// Log errors for top-level items without an onError handler.
				// Child sideload errors are suppressed here because the
				// parent will be notified and surface the error to the user.
				// eslint-disable-next-line no-console -- Deliberately log errors here.
				console.error( 'Upload cancelled', error );
			}
		}

		const { currentOperation, parentId, batchId } = item;

		dispatch< CancelAction >( {
			type: Type.Cancel,
			id,
			error,
		} );
		dispatch.removeItem( id );
		dispatch.revokeBlobUrls( id );

		// A concurrency slot just freed up. Kick any items that were
		// waiting in the queue, mirroring finishOperation's behavior.
		if (
			currentOperation === OperationType.ResizeCrop ||
			currentOperation === OperationType.Rotate
		) {
			for ( const pending of select.getPendingImageProcessing() ) {
				dispatch.processItem( pending.id );
			}
		}
		if ( currentOperation === OperationType.Upload ) {
			for ( const pending of select.getPendingUploads() ) {
				dispatch.processItem( pending.id );
			}
		}

		// If this was a child sideload item, handle the parent.
		if ( parentId ) {
			const parentItem = select.getItem( parentId );
			if ( parentItem ) {
				if ( select.hasPendingItemsByParentId( parentId ) ) {
					// Other children remain — just notify the parent so
					// it can re-check the Finalize gate.
					if (
						parentItem.operations &&
						parentItem.operations.length > 0
					) {
						dispatch.processItem( parentId );
					}
				} else {
					// No children remain and we got here via cancellation,
					// meaning no child succeeded. Cancel the parent too so
					// the block resets rather than showing a partial upload.
					dispatch.cancelItem(
						parentId,
						new UploadError( {
							code: 'IMAGE_PROCESSING_ERROR',
							message: __(
								'The web server cannot generate responsive image sizes for this image. Convert it to JPEG or PNG before uploading.'
							),
							file: parentItem.file,
							cause: error instanceof Error ? error : undefined,
						} )
					);
				}
			}
		}

		// All items of this batch were cancelled or finished.
		if ( batchId && select.isBatchUploaded( batchId ) ) {
			item.onBatchSuccess?.();
		}
	};
}

/**
 * Retries a failed item in the queue.
 *
 * @param id Item ID.
 */
export function retryItem( id: QueueItemId ) {
	return async ( { select, dispatch }: ThunkArgs ) => {
		const item = select.getItem( id );

		if ( ! item ) {
			return;
		}

		// Only retry items that have an error.
		if ( ! item.error ) {
			return;
		}

		dispatch< RetryItemAction >( {
			type: Type.RetryItem,
			id,
		} );

		dispatch.processItem( id );
	};
}
