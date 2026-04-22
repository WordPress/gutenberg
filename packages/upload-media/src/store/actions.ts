/**
 * External dependencies
 */
import { v4 as uuidv4 } from 'uuid';

/**
 * WordPress dependencies
 */
import type { createRegistry } from '@wordpress/data';

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
	ScheduleRetryAction,
	State,
} from './types';
import { ItemStatus, Type } from './types';
import {
	calculateRetryDelay,
	clearRetryTimer,
	retryTimers,
	shouldRetryError,
} from './utils/retry';
import type {
	addItem,
	processItem,
	removeItem,
	revokeBlobUrls,
} from './private-actions';
import { vipsCancelOperations } from './utils';
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
	scheduleRetry: typeof scheduleRetry;
	executeRetry: typeof executeRetry;
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
 * If the error is retryable and the item hasn't exceeded the maximum
 * retry attempts, it will be scheduled for automatic retry instead
 * of being cancelled.
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

		// Clear any pending retry timer for this item.
		clearRetryTimer( id );

		// Check if we should automatically retry instead of cancelling.
		if ( ! silent && error ) {
			const settings = select.getSettings();
			const retrySettings = settings.retry;

			if ( retrySettings ) {
				const retryCount = item.retryCount ?? 0;
				const maxRetries = retrySettings.maxRetryAttempts;

				if ( shouldRetryError( error, retryCount, maxRetries ) ) {
					dispatch.scheduleRetry( id, error );
					return;
				}
			}
		}

		item.abortController?.abort();

		// Cancel any ongoing vips operations for this item.
		await vipsCancelOperations( id );

		if ( ! silent ) {
			const { onError } = item;
			onError?.( error ?? new Error( 'Upload cancelled' ) );
			if ( ! onError && error ) {
				// TODO: Find better way to surface errors with sideloads etc.
				// eslint-disable-next-line no-console -- Deliberately log errors here.
				console.error( 'Upload cancelled', error );
			}
		}

		dispatch< CancelAction >( {
			type: Type.Cancel,
			id,
			error,
		} );
		dispatch.removeItem( id );
		dispatch.revokeBlobUrls( id );

		// All items of this batch were cancelled or finished.
		if ( item.batchId && select.isBatchUploaded( item.batchId ) ) {
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

/**
 * Schedules an automatic retry for a failed item.
 *
 * Uses exponential backoff with jitter to determine the retry delay.
 * The item will be placed in PendingRetry status and automatically
 * retried after the calculated delay.
 *
 * @param id    Item ID.
 * @param error The error that caused the failure.
 */
export function scheduleRetry( id: QueueItemId, error: Error ) {
	return async ( { select, dispatch }: ThunkArgs ) => {
		const item = select.getItem( id );
		if ( ! item ) {
			return;
		}

		const settings = select.getSettings();
		const retrySettings = settings.retry;

		if ( ! retrySettings ) {
			return;
		}

		const currentRetryCount = item.retryCount ?? 0;

		const delay = calculateRetryDelay( {
			attempt: currentRetryCount + 1,
			initialDelay: retrySettings.initialRetryDelayMs,
			maxDelay: retrySettings.maxRetryDelayMs,
			multiplier: retrySettings.backoffMultiplier,
			jitter: retrySettings.retryJitter,
		} );

		// Schedule the retry execution and store timer ID for cleanup.
		const timerId = setTimeout( () => {
			retryTimers.delete( id );
			dispatch.executeRetry( id );
		}, delay );
		retryTimers.set( id, timerId );

		dispatch< ScheduleRetryAction >( {
			type: Type.ScheduleRetry,
			id,
			error,
			retryCount: currentRetryCount,
			nextRetryTimestamp: Date.now() + delay,
		} );
	};
}

/**
 * Executes a scheduled retry for an item.
 *
 * This is called by the timer set in scheduleRetry.
 * It verifies the item is still in PendingRetry status before
 * proceeding with the retry.
 *
 * @param id Item ID.
 */
export function executeRetry( id: QueueItemId ) {
	return async ( { select, dispatch }: ThunkArgs ) => {
		const item = select.getItem( id );

		// Verify item exists and is still pending retry
		// (user may have manually cancelled or retried).
		if ( ! item || item.status !== ItemStatus.PendingRetry ) {
			return;
		}

		// Reset the item to Processing status and clear the error.
		dispatch< RetryItemAction >( {
			type: Type.RetryItem,
			id,
		} );

		// Re-process the item.
		dispatch.processItem( id );
	};
}
