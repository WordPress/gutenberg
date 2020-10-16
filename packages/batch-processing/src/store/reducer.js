/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	BATCH_MAX_SIZE,
	TRANSACTION_NEW,
	TRANSACTION_IN_PROGRESS,
	TRANSACTION_SUCCESS,
	TRANSACTION_ERROR,
} from './constants';

const defaultBatches = {
	lastBatchId: 0,
	enqueuedItems: {},
	transactions: {},
};
export function batches( state = defaultBatches, action ) {
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

		case 'PREPARE_BATCH_TRANSACTION': {
			const { queue, context, transactionId } = action;

			if ( transactionId in state.transactions ) {
				throw new Error(
					`Transaction ${ transactionId } already exists`
				);
			}

			const stateQueue = state.enqueuedItems[ queue ] || {};
			const enqueuedItems = [ ...stateQueue[ context ] ];
			const chunks = {};
			while ( enqueuedItems.length ) {
				const number = chunks.length;
				const chunkId = `${ transactionId }-${ number }`;
				chunks[ chunkId ] = {
					number,
					id: chunkId,
					items: enqueuedItems.splice( 0, BATCH_MAX_SIZE ),
				};
			}

			const transaction = {
				id: transactionId,
				state: TRANSACTION_NEW,
				queue,
				context,
				chunks,
				results: {},
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
				transactions: {
					...state.transactions,
					[ transactionId ]: transaction,
				},
			};
		}

		case 'COMMIT_START': {
			const { transactionId } = action;
			return {
				...state,
				transactions: {
					...state.transactions,
					[ transactionId ]: {
						...state.transactions[ transactionId ],
						state: TRANSACTION_IN_PROGRESS,
					},
				},
			};
		}

		case 'COMMIT_SUCCESS': {
			const { transactionId } = action;
			return {
				...state,
				transactions: {
					...state.transactions,
					[ transactionId ]: {
						...state.transactions[ transactionId ],
						state: TRANSACTION_SUCCESS,
					},
				},
			};
		}

		case 'COMMIT_ERROR': {
			const { transactionId, error } = action;
			return {
				...state,
				transactions: {
					...state.transactions,
					[ transactionId ]: {
						...state.transactions[ transactionId ],
						state: TRANSACTION_ERROR,
						error,
					},
				},
			};
		}

		case 'COMMIT_CHUNK_START': {
			const { transactionId, chunkId } = action;
			return {
				...state,
				transactions: {
					...state.transactions,
					[ transactionId ]: {
						...state.transactions[ transactionId ],
						chunks: {
							...state.transactions[ transactionId ].chunks,
							[ chunkId ]: {
								...state.transactions[ transactionId ].chunks[
									chunkId
								],
								state: TRANSACTION_SUCCESS,
							},
						},
					},
				},
			};
		}

		case 'COMMIT_CHUNK_SUCCESS': {
			const { transactionId, chunkId, results } = action;

			const stateTransaction = state.transactions[ transactionId ] || {};
			return {
				...state,
				transactions: {
					...state.transactions,
					[ transactionId ]: {
						...stateTransaction,
						chunks: {
							...stateTransaction.chunks,
							[ chunkId ]: {
								...stateTransaction.chunks[ chunkId ],
								state: TRANSACTION_SUCCESS,
							},
						},
						results: {
							...stateTransaction.results,
							...results,
						},
					},
				},
			};
		}

		case 'COMMIT_CHUNK_ERROR': {
			const { transactionId, error, chunkId } = action;
			return {
				...state,
				transactions: {
					...state.transactions,
					[ transactionId ]: {
						...state.transactions[ transactionId ],
						chunks: {
							...state.transactions[ transactionId ].chunks,
							[ chunkId ]: {
								...state.transactions[ transactionId ].chunks[
									chunkId
								],
								error,
								state: TRANSACTION_ERROR,
							},
						},
					},
				},
			};
		}
	}

	return state;
}

export function processors( state = {}, action ) {
	switch ( action.type ) {
		case 'REGISTER_PROCESSOR':
			const { queue, callback } = action;

			return {
				...state,
				[ queue ]: callback,
			};
	}

	return state;
}

export default combineReducers( {
	batches,
	processors,
} );
