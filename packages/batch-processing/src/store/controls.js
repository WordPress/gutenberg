/**
 * WordPress dependencies
 */
import { createRegistryControl } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { MODULE_KEY } from './constants';

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

export function processChunk( transaction, chunkId ) {
	return {
		type: 'PROCESS_CHUNK',
		transaction,
		chunkId,
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
			return registry.select( MODULE_KEY )[ selectorName ]( ...args );
		}
	),

	DISPATCH: createRegistryControl(
		( registry ) => ( { actionName, args } ) => {
			return registry.dispatch( MODULE_KEY )[ actionName ]( ...args );
		}
	),

	ENQUEUE_ITEM_AND_AUTOCOMMIT: createRegistryControl(
		( registry ) => async ( { queue, context, item } ) => {
			const { itemId } = await registry
				.dispatch( MODULE_KEY )
				.enqueueItem( queue, context, item );

			const results = await registry
				.dispatch( MODULE_KEY )
				.commit( queue, context );

			return results[ itemId ];
		}
	),

	PROCESS_CHUNK: createRegistryControl(
		( registry ) => async ( { transaction, chunkId } ) => {
			const { chunks, queue } = transaction;
			const chunk = chunks[ chunkId ];
			const processor = registry
				.select( MODULE_KEY )
				.getProcessor( queue );
			if ( ! processor ) {
				throw new Error(
					`There is no batch processor registered for "${ queue }" queue. ` +
						`Register one by dispatching registerProcessor() action on ${ MODULE_KEY } store.`
				);
			}
			const itemIds = chunk.items.map( ( { id } ) => id );
			const items = chunk.items.map( ( { item } ) => item );
			const results = await processor( items );
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
