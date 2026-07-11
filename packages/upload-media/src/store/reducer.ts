/**
 * Internal dependencies
 */
import {
	type AccumulateSubSizeAction,
	type AddAction,
	type AddGifConversionAction,
	type AddOperationsAction,
	type CacheBlobUrlAction,
	type CancelAction,
	type GifConversion,
	ItemStatus,
	type OperationFinishAction,
	type OperationStartAction,
	type PauseItemAction,
	type PauseQueueAction,
	type QueueItem,
	type RemoveAction,
	type ResumeItemAction,
	type ResumeQueueAction,
	type RetryItemAction,
	type RevokeBlobUrlsAction,
	type ScheduleRetryAction,
	type State,
	Type,
	type UnknownAction,
	type UpdateGifConversionAction,
	type RemoveGifConversionAction,
	type UpdateProgressAction,
	type UpdateSettingsAction,
} from './types';
import {
	DEFAULT_MAX_CONCURRENT_UPLOADS,
	DEFAULT_MAX_CONCURRENT_IMAGE_PROCESSING,
	DEFAULT_RETRY_SETTINGS,
} from './constants';

const noop = () => {};

const DEFAULT_STATE: State = {
	queue: [],
	queueStatus: 'active',
	blobUrls: {},
	gifConversions: [],
	settings: {
		mediaUpload: noop,
		maxConcurrentUploads: DEFAULT_MAX_CONCURRENT_UPLOADS,
		maxConcurrentImageProcessing: DEFAULT_MAX_CONCURRENT_IMAGE_PROCESSING,
		retry: { ...DEFAULT_RETRY_SETTINGS },
	},
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
	| AddGifConversionAction
	| UpdateGifConversionAction
	| RemoveGifConversionAction
	| UnknownAction;

function reducer(
	state = DEFAULT_STATE,
	action: Action = { type: Type.Unknown }
) {
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
				queue: state.queue.map(
					( item ): QueueItem =>
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
				queue: state.queue.map(
					( item ): QueueItem =>
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
				queue: [ ...state.queue, action.item ],
			};

		case Type.Cancel: {
			/*
			 * A cancelled item invalidates related GIF conversion records:
			 * the original GIF upload failed (matched by itemId, e.g. a
			 * total sub-size failure that deletes the attachment), the bare
			 * finalize parent of a post-upload conversion failed (matched by
			 * its gifConversionItemId), or the transcode sideload failed
			 * (matched through its parent, which is either the original item
			 * or such a bare finalize parent).
			 */
			const cancelledItem = state.queue.find(
				( item ) => item.id === action.id
			);
			const isGifTranscode =
				cancelledItem?.additionalData?.image_size === 'animated_video';
			const transcodeParent = isGifTranscode
				? state.queue.find(
						( item ) => item.id === cancelledItem?.parentId
				  )
				: undefined;
			const gifConversions = ( state.gifConversions ?? [] ).filter(
				( conversion ) =>
					conversion.itemId !== action.id &&
					conversion.itemId !== cancelledItem?.gifConversionItemId &&
					! (
						isGifTranscode &&
						( conversion.itemId === cancelledItem?.parentId ||
							conversion.itemId ===
								transcodeParent?.gifConversionItemId )
					)
			);

			return {
				...state,
				queue: state.queue.map(
					( item ): QueueItem =>
						item.id === action.id
							? {
									...item,
									error: action.error,
							  }
							: item
				),
				gifConversions,
			};
		}

		case Type.RetryItem:
			return {
				...state,
				queue: state.queue.map(
					( item ): QueueItem =>
						item.id === action.id
							? {
									...item,
									status: ItemStatus.Processing,
									error: undefined,
									retryCount: ( item.retryCount ?? 0 ) + 1,
									abortController: new AbortController(),
							  }
							: item
				),
			};

		case Type.ScheduleRetry:
			return {
				...state,
				queue: state.queue.map(
					( item ): QueueItem =>
						item.id === action.id
							? {
									...item,
									status: ItemStatus.PendingRetry,
									error: action.error,
									retryCount: action.retryCount,
									nextRetryTimestamp:
										action.nextRetryTimestamp,
							  }
							: item
				),
			};

		case Type.Remove:
			return {
				...state,
				queue: state.queue.filter( ( item ) => item.id !== action.id ),
			};

		case Type.OperationStart: {
			return {
				...state,
				queue: state.queue.map(
					( item ): QueueItem =>
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

		case Type.OperationFinish:
			return {
				...state,
				queue: state.queue.map( ( item ): QueueItem => {
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
				queue: state.queue.map(
					( item ): QueueItem =>
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
				queue: state.queue.map(
					( item ): QueueItem =>
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

		case Type.AddGifConversion:
			return {
				...state,
				gifConversions: [
					...( state.gifConversions ?? [] ),
					action.conversion,
				],
			};

		case Type.UpdateGifConversion:
			return {
				...state,
				gifConversions: ( state.gifConversions ?? [] ).map(
					( conversion ): GifConversion =>
						conversion.itemId === action.itemId
							? {
									...conversion,
									status: action.status ?? conversion.status,
									attachmentId:
										action.attachmentId ??
										conversion.attachmentId,
							  }
							: conversion
				),
			};

		case Type.RemoveGifConversion:
			return {
				...state,
				gifConversions: ( state.gifConversions ?? [] ).filter(
					( conversion ) => conversion.itemId !== action.itemId
				),
			};
	}

	return state;
}

export default reducer;
