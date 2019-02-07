/**
 * WordPress dependencies
 */
import { default as triggerFetch } from '@wordpress/api-fetch';
import { createRegistryControl } from '@wordpress/data';

export function apiFetch( request ) {
	return {
		type: 'API_FETCH',
		request,
	};
}

export function select( reducerKey, selectorName, ...args ) {
	return {
		type: 'SELECT',
		reducerKey,
		selectorName,
		args,
	};
}

/**
 * Dispatches an action.
 *
 * @param {string} storeKey   Store key.
 * @param {string} actionName Action name.
 * @param  {Array} args       Action arguments.
 *
 * @return {Object} control descriptor.
 */
export function dispatch( storeKey, actionName, ...args ) {
	return {
		type: 'DISPATCH',
		storeKey,
		actionName,
		args,
	};
}

export default {
	API_FETCH( { request } ) {
		return triggerFetch( request );
	},
	SELECT: createRegistryControl( (registry ) => ( { storeKey, selectorName, args } ) {
		return registry.select( storeKey )[ selectorName ]( ...args );
	} ),
	DISPATCH: createRegistryControl( ( registry ) => ( { storeKey, actionName, args } ) => {
		return registry.dispatch( storeKey )[ actionName ]( ...args );
	} ),
};

export default controls;
