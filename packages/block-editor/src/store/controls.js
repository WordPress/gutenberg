/**
 * WordPress dependencies
 */
import { createRegistryControl } from '@wordpress/data';
import wpApiFetch from '@wordpress/api-fetch';

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

export function dispatch( storeName, dispatcherName, ...args ) {
	return {
		type: 'DISPATCH',
		storeName,
		dispatcherName,
		args,
	};
}

/**
 * Trigger an API Fetch request.
 *
 * @param {Object} request API Fetch Request Object.
 * @return {Object} control descriptor.
 */
export function apiFetch( request ) {
	return {
		type: 'API_FETCH',
		request,
	};
}

const controls = {
	SELECT: createRegistryControl( ( registry ) => ( { storeName, selectorName, args } ) => {
		return registry.select( storeName )[ selectorName ]( ...args );
	} ),
	DISPATCH: createRegistryControl( ( registry ) => ( { storeName, dispatcherName, args } ) => {
		return registry.dispatch( storeName )[ dispatcherName ]( ...args );
	} ),
	API_FETCH( { request } ) {
		return wpApiFetch( { ... request } );
	},
};

export default controls;
