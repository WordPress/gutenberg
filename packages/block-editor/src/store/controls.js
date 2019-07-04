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
	API_FETCH( { request } ) {
		// todo: replace with wp.api-fetch for real implementation
		return window.fetch( request.path )
			.then( ( response ) => response.json() );
	},
};

export default controls;
