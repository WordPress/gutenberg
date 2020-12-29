/**
 * WordPress dependencies
 */
import { createRegistryControl } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { STORE_NAME, STATE_ERROR } from './constants';

/**
 * Calls a selector using chosen registry.
 *
 * @param {string} selectorName Selector name.
 * @param {Array} args          Selector arguments.
 * @return {Object} control descriptor.
 */
export function select( selectorName, ...args ) {
	return {
		type: 'SELECT',
		selectorName,
		args,
	};
}

/**
 * Dispatches an action using chosen registry.
 *
 * @param {string} actionName   Action name.
 * @param {Array} args          Selector arguments.
 * @return {Object} control descriptor.
 */
export function dispatch( actionName, ...args ) {
	return {
		type: 'DISPATCH',
		actionName,
		args,
	};
}

export function processTransaction( batch, transactionId ) {
	return {
		type: 'PROCESS_TRANSACTION',
		batch,
		transactionId,
	};
}

export function enqueueItemAndAutocommit( queue, context, item ) {
	return {
		type: 'ENQUEUE_ITEM_AND_AUTOCOMMIT',
		queue,
		context,
		item,
	};
}

const controls = {
	SELECT: createRegistryControl(
		( registry ) => ( { selectorName, args } ) => {
			return registry.select( STORE_NAME )[ selectorName ]( ...args );
		}
	),

	DISPATCH: createRegistryControl(
		( registry ) => ( { actionName, args } ) => {
			return registry.dispatch( STORE_NAME )[ actionName ]( ...args );
		}
	),

	ENQUEUE_ITEM_AND_AUTOCOMMIT: createRegistryControl(
		( registry ) => async ( { queue, context, item } ) => {
			const { itemId } = await registry
				.dispatch( STORE_NAME )
				.enqueueItem( queue, context, item );

			// @TODO autocommit when batch size exceeds the maximum or n milliseconds passes
			const batch = await registry
				.dispatch( STORE_NAME )
				.processBatch( queue, context );

			if ( batch.state === STATE_ERROR ) {
				throw batch.errors[ itemId ];
			}

			return batch.results[ itemId ];
		}
	),

	PROCESS_TRANSACTION: createRegistryControl(
		( registry ) => async ( { batch, transactionId } ) => {
			const { transactions, queue } = batch;
			const transaction = transactions[ transactionId ];
			const processor = registry
				.select( STORE_NAME )
				.getProcessor( queue );
			if ( ! processor ) {
				throw new Error(
					`There is no batch processor registered for "${ queue }" queue. ` +
						`Register one by dispatching registerProcessor() action on ${ STORE_NAME } store.`
				);
			}
			const itemIds = transaction.items.map( ( { id } ) => id );
			const items = transaction.items.map( ( { item } ) => item );
			let results;
			try {
				results = await processor( items, batch );
			} catch ( exception ) {
				const errorsById = {};
				for ( let i = 0, max = itemIds.length; i < max; i++ ) {
					errorsById[ itemIds[ i ] ] = Array.isArray( exception )
						? exception[ i ]
						: exception;
				}
				throw {
					isTransactionError: true,
					exception,
					errorsById,
				};
			}

			// @TODO Assert results.length == items.length
			const resultsById = {};
			for ( let i = 0, max = itemIds.length; i < max; i++ ) {
				resultsById[ itemIds[ i ] ] = results[ i ];
			}
			return resultsById;
		}
	),
};

export default controls;
