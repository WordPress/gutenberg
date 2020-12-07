/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * Internal dependencies
 */
import {
	BATCH_MAX_SIZE,
	STATE_NEW,
	STATE_IN_PROGRESS,
	STATE_SUCCESS,
	STATE_ERROR,
} from './constants';

const defaultState = {
	lastBatchId: 0,
	enqueuedItems: {},
	batches: {},
	processors: {},
	promises: {},
};

export default function reducer( state = defaultState, action ) {
	switch ( action.type ) {
		case 'ENQUEUE_ITEM': {
			const { queue, context, item, itemId } = action;

			const stateQueue = state.enqueuedItems[ queue ] || {};
			const stateItems = stateQueue[ context ] || [];

			return {
				...state,
				enqueuedItems: {
					...state.enqueuedItems,
					[ queue ]: {
						...stateQueue,
						[ context ]: [ ...stateItems, { id: itemId, item } ],
					},
				},
			};
		}

		case 'PREPARE_BATCH_FOR_PROCESSING': {
			const { queue, context, batchId, meta } = action;

			if ( batchId in state.batches ) {
				throw new Error( `Batch ${ batchId } already exists` );
			}

			const stateQueue = state.enqueuedItems[ queue ] || {};
			const enqueuedItems = [ ...( stateQueue[ context ] || [] ) ];
			const sortedItemIds = enqueuedItems.map( ( { id } ) => id );
			const transactions = {};
			let transactionNb = 0;
			while ( enqueuedItems.length ) {
				const transactionId = `${ batchId }-${ transactionNb }`;
				transactions[ transactionId ] = {
					number: transactionNb,
					id: transactionId,
					items: enqueuedItems.splice( 0, BATCH_MAX_SIZE ),
				};
				++transactionNb;
			}

			const batch = {
				id: batchId,
				state: STATE_NEW,
				queue,
				context,
				sortedItemIds,
				transactions,
				results: {},
				meta,
			};

			return {
				...state,
				enqueuedItems: {
					...state.enqueuedItems,
					[ queue ]: {
						...stateQueue,
						[ context ]: [],
					},
				},
				batches: {
					...state.batches,
					[ batchId ]: batch,
				},
			};
		}

		case 'SETUP_PROMISE': {
			return {
				...state,
				promises: {
					...state.promises,
					[ action.queue ]: {
						...( state.promises[ action.queue ] || {} ),
						[ action.context ]: {
							promise: action.promise,
							resolve: action.resolve,
							reject: action.reject,
						},
					},
				},
			};
		}

		case 'BATCH_START': {
			const { batchId } = action;
			return {
				...state,
				batches: {
					...state.batches,
					[ batchId ]: {
						...state.batches[ batchId ],
						state: STATE_IN_PROGRESS,
					},
				},
			};
		}

		case 'BATCH_FINISH': {
			const { batchId, state: commitState } = action;
			return {
				...state,
				batches: {
					...state.batches,
					[ batchId ]: {
						...state.batches[ batchId ],
						state:
							commitState === STATE_SUCCESS
								? STATE_SUCCESS
								: STATE_ERROR,
					},
				},
				promises: {
					...state.promises,
					[ action.queue ]: omit(
						state.promises[ action.queue ] || {},
						[ action.context ]
					),
				},
			};
		}

		case 'COMMIT_TRANSACTION_START': {
			const { batchId, transactionId } = action;
			return {
				...state,
				batches: {
					...state.batches,
					[ batchId ]: {
						...state.batches[ batchId ],
						transactions: {
							...state.batches[ batchId ].transactions,
							[ transactionId ]: {
								...state.batches[ batchId ].transactions[
									transactionId
								],
								state: STATE_IN_PROGRESS,
							},
						},
					},
				},
			};
		}

		case 'COMMIT_TRANSACTION_FINISH': {
			const {
				batchId,
				state: transactionState,
				transactionId,
				results = {},
				errors = {},
				exception,
			} = action;

			const stateBatch = state.batches[ batchId ] || {};
			return {
				...state,
				batches: {
					...state.batches,
					[ batchId ]: {
						...stateBatch,
						transactions: {
							...stateBatch.transactions,
							[ transactionId ]: {
								...stateBatch.transactions[ transactionId ],
								state: STATE_SUCCESS,
							},
						},
						results: {
							...stateBatch.results,
							...results,
						},
						state:
							transactionState === STATE_SUCCESS
								? STATE_SUCCESS
								: STATE_ERROR,
						errors,
						exception,
					},
				},
			};
		}

		case 'REGISTER_PROCESSOR':
			const { queue, callback } = action;

			return {
				...state,
				processors: {
					...state.processors,
					[ queue ]: callback,
				},
			};
	}

	return state;
}
