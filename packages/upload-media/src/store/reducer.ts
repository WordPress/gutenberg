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
 * Recomputes the progress of a top-level item.
 *
 * Progress is the share of operations finished out of all operations seen so
 * far, the item's own and those of its sub-size items. Sub-sizes are only
 * queued once the original has uploaded, which grows the total, so progress
 * never moves backwards.
 *
 * @param queue Upload queue.
 * @param id    ID of the item, or of a sub-size item whose parent to update.
 *
 * @return Updated queue.
 */
function withProgress( queue: QueueItem[], id?: QueueItemId ): QueueItem[] {
	let item = queue.find( ( { id: itemId } ) => itemId === id );
	if ( item?.parentId ) {
		const parentId = item.parentId;
		item = queue.find( ( { id: itemId } ) => itemId === parentId );
	}
	if ( ! item || item.parentId ) {
		return queue;
	}

	const completed = item.completedOperations ?? 0;
	let remaining = item.operations?.length ?? 0;
	for ( const child of queue ) {
		if ( child.parentId === item.id ) {
			remaining += child.operations?.length ?? 0;
		}
	}

	const total = completed + remaining;
	const progress = Math.max(
		item.progress ?? 0,
		total ? Math.round( ( completed / total ) * 100 ) : 0
	);
	if ( progress === item.progress ) {
		return queue;
	}

	const target = item;
	return queue.map( ( queueItem ) =>
		queueItem === target ? { ...queueItem, progress } : queueItem
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
				queue: withProgress(
					[ ...state.queue, action.item ],
					action.item.id
				),
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
			const parentId = state.queue.find(
				( item ) => item.id === action.id
			)?.parentId;
			return {
				...state,
				queue: withProgress(
					state.queue.filter( ( item ) => item.id !== action.id ),
					parentId
				),
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
				queue: withProgress(
					state.queue.map( ( item ): QueueItem => {
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
					action.id
				),
			};

		case Type.OperationFinish: {
			// Sub-size operations count towards their parent's progress.
			const finished = state.queue.find(
				( item ) => item.id === action.id
			);
			const progressId = finished?.parentId ?? action.id;

			const queue = state.queue.map( ( item ): QueueItem => {
				let updated = item;

				if ( item.id === progressId ) {
					updated = {
						...updated,
						completedOperations:
							( item.completedOperations ?? 0 ) + 1,
					};
				}

				if ( item.id !== action.id ) {
					return updated;
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
					...updated,
					currentOperation: undefined,
					operations,
					...action.item,
					attachment,
					additionalData: {
						...item.additionalData,
						...action.item.additionalData,
					},
				};
			} );

			return {
				...state,
				queue: withProgress( queue, progressId ),
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
