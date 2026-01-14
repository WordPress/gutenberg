/**
 * Internal dependencies
 */
import {
	type AddAction,
	type AddOperationsAction,
	type CacheBlobUrlAction,
	type CancelAction,
	type OperationFinishAction,
	type OperationStartAction,
	type PauseQueueAction,
	type QueueItem,
	type RemoveAction,
	type ResumeQueueAction,
	type RevokeBlobUrlsAction,
	type State,
	Type,
	type UnknownAction,
	type UpdateSettingsAction,
} from './types';

const noop = () => {};

const DEFAULT_STATE: State = {
	queue: [],
	queueStatus: 'active',
	blobUrls: {},
	settings: {
		mediaUpload: noop,
	},
};

type Action =
	| AddAction
	| RemoveAction
	| CancelAction
	| PauseQueueAction
	| ResumeQueueAction
	| AddOperationsAction
	| OperationFinishAction
	| OperationStartAction
	| CacheBlobUrlAction
	| RevokeBlobUrlsAction
	| UpdateSettingsAction
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

		case Type.Add:
			return {
				...state,
				queue: [ ...state.queue, action.item ],
			};

		case Type.Cancel:
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
