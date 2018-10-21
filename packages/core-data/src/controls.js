/**
 * WordPress dependencies
 */
import { default as triggerApiFetch } from '@wordpress/api-fetch';
import { select as selectData } from '@wordpress/data';

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

/**
 * Calls a selector using the current state.
 * @param {string} selectorName Selector name.
 * @param  {Array} args         Selector arguments.
 *
 * @return {Object} control descriptor.
 */
export function select( selectorName, ...args ) {
	return {
		type: 'SELECT',
		selectorName,
		args,
	};
}

const controls = {
	API_FETCH( { request } ) {
		return triggerApiFetch( request );
	},

	SELECT( { selectorName, args } ) {
		return selectData( 'core' )[ selectorName ]( ...args );
	},

	RESOLVE_PROMISE( { promise } ) {
		return promise;
	},
};

export default controls;
