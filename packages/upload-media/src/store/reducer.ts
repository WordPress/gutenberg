import {
	type AccumulateSubSizeAction,
	type AddAction,
	type AddOperationsAction,
	type CacheBlobUrlAction,
	type CancelAction,
	ItemStatus,
	type OperationFinishAction,
	type OperationStartAction,
	type PauseItemAction,
	type PauseQueueAction,
	type QueueItem,
	type QueueItemId,
	type RemoveAction,
	type ResumeItemAction,
	type ResumeQueueAction,
	type RetryItemAction,
	type RevokeBlobUrlsAction,
	type ScheduleRetryAction,
	type State,
	Type,
	type UnknownAction,
	type UpdateProgressAction,
	type UpdateSettingsAction,
} from './types';
import {
	DEFAULT_MAX_CONCURRENT_UPLOADS,
	DEFAULT_MAX_CONCURRENT_IMAGE_PROCESSING,
	DEFAULT_RETRY_SETTINGS,
} from './constants';

const noop = () => {};

/**
 * Advances the progress of the top-level item that an item counts towards.
 *
 * Moves progress by the share of remaining operations, the item's own and
 * those of its sub-size items, that just finished or were dropped. Sub-sizes
 * are only queued once the original has uploaded, so the total grows over
 * time. Spreading what is left of the bar over what is left of the work keeps
 * progress moving with every operation.
 *
 * @param queue Upload queue, before the operations are taken off.
 * @param id    ID of the item whose operations finished or were dropped.
 * @param count Number of operations that finished or were dropped.
 *
 * @return Updated queue.
 */
function advanceProgress(
	queue: QueueItem[],
	id: QueueItemId,
	count: number
): QueueItem[] {
	let root = queue.find( ( item ) => item.id === id );
	while ( root?.parentId ) {
		const { parentId } = root;
		root = queue.find( ( item ) => item.id === parentId );
	}
	if ( ! root || ! count ) {
		return queue;
	}

	// Sub-size items are always queued after their parent.
	const ids = new Set( [ root.id ] );
	let remaining = 0;
	for ( const item of queue ) {
		if ( item.parentId && ids.has( item.parentId ) ) {
			ids.add( item.id );
		}
		if ( ids.has( item.id ) ) {
			remaining += item.operations?.length ?? 0;
		}
	}
	if ( ! remaining ) {
		return queue;
	}

	const current = root.progress ?? 0;
	const progress = Math.round(
		current +
			( ( 100 - current ) * Math.min( count, remaining ) ) / remaining
	);
	if ( progress === root.progress ) {
		return queue;
	}

	const target = root;
	return queue.map( ( item ) =>
		item === target ? { ...item, progress } : item
	);
}

const DEFAULT_STATE: State = {
	queue: [],
	queueStatus: 'active',
	blobUrls: {},
	settings: {
		mediaUpload: noop,
		maxConcurrentUploads: DEFAULT_MAX_CONCURRENT_UPLOADS,
		maxConcurrentImageProcessing: DEFAULT_MAX_CONCURRENT_IMAGE_PROCESSING,
		retry: { ...DEFAULT_RETRY_SETTINGS },
	},
	failureCount: 0,
};

type Action =
	| AccumulateSubSizeAction
	| AddAction
	| RemoveAction
	| CancelAction
	| RetryItemAction
	| ScheduleRetryAction
	| PauseItemAction
	| ResumeItemAction
	| PauseQueueAction
	| ResumeQueueAction
	| AddOperationsAction
	| OperationFinishAction
	| OperationStartAction
	| CacheBlobUrlAction
	| RevokeBlobUrlsAction
	| UpdateProgressAction
	| UpdateSettingsAction
	| UnknownAction;

function reducer(
	state = DEFAULT_STATE,
	action: Action = { type: Type.Unknown }
): State {
	switch ( action.type ) {
		case Type.PauseQueue: {
			return {
				...state,
				queueStatus: 'paused',
			};
		}

		case Type.ResumeQueue: {
			return {
				...state,
				queueStatus: 'active',
			};
		}

		case Type.PauseItem:
			return {
				...state,
				queue: state.queue.map( ( item ): QueueItem =>
					item.id === action.id
						? {
								...item,
								status: ItemStatus.Paused,
							}
						: item
				),
			};

		case Type.ResumeItem:
			return {
				...state,
				queue: state.queue.map( ( item ): QueueItem =>
					item.id === action.id
						? {
								...item,
								status: ItemStatus.Processing,
							}
						: item
				),
			};

		case Type.Add:
			return {
				...state,
				queue: [
					...state.queue,
					action.item.parentId || action.item.progress !== undefined
						? action.item
						: { ...action.item, progress: 0 },
				],
			};

		case Type.Cancel: {
			/*
			 * Only top-level items count as failures. A sub-size that fails on
			 * its own does not stop the attachment from being uploaded, and a
			 * sub-size failure bad enough to sink the whole attachment cancels
			 * the parent too - which is the cancellation counted here.
			 */
			const cancelled = state.queue.find(
				( item ) => item.id === action.id
			);
			return {
				...state,
				failureCount:
					cancelled && ! cancelled.parentId
						? state.failureCount + 1
						: state.failureCount,
				queue: state.queue.map( ( item ): QueueItem =>
					item.id === action.id
						? {
								...item,
								error: action.error,
							}
						: item
				),
			};
		}

		case Type.RetryItem:
			return {
				...state,
				queue: state.queue.map( ( item ): QueueItem =>
					item.id === action.id
						? {
								...item,
								status: ItemStatus.Processing,
								error: undefined,
								retryCount: ( item.retryCount ?? 0 ) + 1,
								abortController: new AbortController(),
								/*
								 * The failed operation is still recorded on
								 * the item: nothing finishes it when it
								 * fails, and while the item waits out the
								 * backoff that is what keeps it out of the
								 * concurrency pools. Clear it now that the
								 * item is about to run again, so processItem
								 * does not mistake it for an operation still
								 * in flight and skip the retry.
								 */
								currentOperation: undefined,
							}
						: item
				),
			};

		case Type.ScheduleRetry:
			return {
				...state,
				queue: state.queue.map( ( item ): QueueItem =>
					item.id === action.id
						? {
								...item,
								status: ItemStatus.PendingRetry,
								error: action.error,
								retryCount: action.retryCount,
								nextRetryTimestamp: action.nextRetryTimestamp,
							}
						: item
				),
			};

		case Type.Remove: {
			// A dropped sub-size's operations no longer hold its parent back.
			const removed = state.queue.find(
				( item ) => item.id === action.id
			);
			const queue = removed?.parentId
				? advanceProgress(
						state.queue,
						action.id,
						removed.operations?.length ?? 0
					)
				: state.queue;
			return {
				...state,
				queue: queue.filter( ( item ) => item.id !== action.id ),
			};
		}

		case Type.OperationStart: {
			return {
				...state,
				queue: state.queue.map( ( item ): QueueItem =>
					item.id === action.id
						? {
								...item,
								currentOperation: action.operation,
							}
						: item
				),
			};
		}

		case Type.AddOperations:
			return {
				...state,
				queue: state.queue.map( ( item ): QueueItem => {
					if ( item.id !== action.id ) {
						return item;
					}

					return {
						...item,
						operations: [
							...( item.operations || [] ),
							...action.operations,
						],
					};
				} ),
			};

		case Type.OperationFinish: {
			// Sub-size operations count towards their parent's progress.
			const finished = state.queue.find(
				( item ) => item.id === action.id
			);
			const queue = advanceProgress(
				state.queue,
				action.id,
				finished?.operations?.length ? 1 : 0
			);

			return {
				...state,
				queue: queue.map( ( item ): QueueItem => {
					if ( item.id !== action.id ) {
						return item;
					}

					const operations = item.operations
						? item.operations.slice( 1 )
						: [];

					// Prevent an empty object if there's no attachment data.
					const attachment =
						item.attachment || action.item.attachment
							? {
									...item.attachment,
									...action.item.attachment,
								}
							: undefined;

					return {
						...item,
						currentOperation: undefined,
						operations,
						...action.item,
						attachment,
						additionalData: {
							...item.additionalData,
							...action.item.additionalData,
						},
					};
				} ),
			};
		}

		case Type.CacheBlobUrl: {
			const blobUrls = state.blobUrls[ action.id ] || [];
			return {
				...state,
				blobUrls: {
					...state.blobUrls,
					[ action.id ]: [ ...blobUrls, action.blobUrl ],
				},
			};
		}

		case Type.RevokeBlobUrls: {
			const newBlobUrls = { ...state.blobUrls };
			delete newBlobUrls[ action.id ];

			return {
				...state,
				blobUrls: newBlobUrls,
			};
		}

		case Type.UpdateProgress:
			return {
				...state,
				queue: state.queue.map( ( item ): QueueItem =>
					item.id === action.id
						? {
								...item,
								progress: action.progress,
							}
						: item
				),
			};

		case Type.AccumulateSubSize:
			return {
				...state,
				queue: state.queue.map( ( item ): QueueItem =>
					item.id === action.id
						? {
								...item,
								subSizes: [
									...( item.subSizes || [] ),
									action.subSize,
								],
							}
						: item
				),
			};

		case Type.UpdateSettings: {
			return {
				...state,
				settings: {
					...state.settings,
					...action.settings,
				},
			};
		}
	}

	return state;
}

export default reducer;
