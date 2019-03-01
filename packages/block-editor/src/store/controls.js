/**
 * WordPress dependencies
 */
import { createRegistryControl } from '@wordpress/data';

/**
 * Calls a selector using the current state.
 *
 * @param {string} storeName    Store name.
 * @param {string} selectorName Selector name.
 * @param  {Array} args         Selector arguments.
 *
 * @return {Object} control descriptor.
 */
export function select( storeName, selectorName, ...args ) {
	return {
		type: 'SELECT',
		storeName,
		selectorName,
		args,
	};
}

/**
 * Dispatches a control action for triggering a registry dispatch.
 *
 * @param {string} storeKey
 * @param {string} actionName
 * @param {Array} args  Arguments for the dispatch action.
 *
 * @return {Object}  control descriptor.
 */
export function dispatch( storeKey, actionName, ...args ) {
	return {
		type: 'DISPATCH',
		storeKey,
		actionName,
		args,
	};
}

const controls = {
	SELECT: createRegistryControl( ( registry ) => ( { storeName, selectorName, args } ) => {
		return registry.select( storeName )[ selectorName ]( ...args );
	} ),
	DISPATCH: createRegistryControl(
		( registry ) => ( { storeKey, actionName, args } ) => {
			return registry.dispatch( storeKey )[ actionName ]( ...args );
		}
	),
};

export default controls;
