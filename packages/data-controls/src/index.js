/**
 * WordPress dependencies
 */
import triggerFetch from '@wordpress/api-fetch';
import { controls as dataControls } from '@wordpress/data';
import deprecated from '@wordpress/deprecated';

/**
 * Dispatches a control action for triggering an api fetch call.
 *
 * @param {Object} request Arguments for the fetch request.
 *
 * @example
 * ```js
 * import { apiFetch } from '@wordpress/data-controls';
 *
 * // Action generator using apiFetch
 * export function* myAction() {
 * 	const path = '/v2/my-api/items';
 * 	const items = yield apiFetch( { path } );
 * 	// do something with the items.
 * }
 * ```
 *
 * @return {Object} The control descriptor.
 */
export function apiFetch( request ) {
	return {
		type: 'API_FETCH',
		request,
	};
}

/**
 * Control for resolving a selector in a registered data store.
 * Alias for the `resolveSelect` built-in control in the `@wordpress/data` package.
 *
 * @param {Array} args Arguments passed without change to the `@wordpress/data` control.
 */
export function select( ...args ) {
	deprecated( '`select` control in `@wordpress/data-controls`', {
		since: '5.7',
		alternative: 'built-in `resolveSelect` control in `@wordpress/data`',
	} );

	return dataControls.resolveSelect( ...args );
}

/**
 * Control for calling a selector in a registered data store.
 * Alias for the `select` built-in control in the `@wordpress/data` package.
 *
 * @param {Array} args Arguments passed without change to the `@wordpress/data` control.
 */
export function syncSelect( ...args ) {
	deprecated( '`syncSelect` control in `@wordpress/data-controls`', {
		since: '5.7',
		alternative: 'built-in `select` control in `@wordpress/data`',
	} );

	return dataControls.select( ...args );
}

/**
 * Control for dispatching an action in a registered data store.
 * Alias for the `dispatch` control in the `@wordpress/data` package.
 *
 * @param {Array} args Arguments passed without change to the `@wordpress/data` control.
 */
export function dispatch( ...args ) {
	deprecated( '`dispatch` control in `@wordpress/data-controls`', {
		since: '5.7',
		alternative: 'built-in `dispatch` control in `@wordpress/data`',
	} );

	return dataControls.dispatch( ...args );
}

/**
 * Dispatches a control action for awaiting on a promise to be resolved.
 *
 * @param {Object} promise Promise to wait for.
 *
 * @example
 * ```js
 * import { __unstableAwaitPromise } from '@wordpress/data-controls';
 *
 * // Action generator using apiFetch
 * export function* myAction() {
 * 	const promise = getItemsAsync();
 * 	const items = yield __unstableAwaitPromise( promise );
 * 	// do something with the items.
 * }
 * ```
 *
 * @return {Object} The control descriptor.
 */
export const __unstableAwaitPromise = function ( promise ) {
	return {
		type: 'AWAIT_PROMISE',
		promise,
	};
};

/**
 * The default export is what you use to register the controls with your custom
 * store.
 *
 * @example
 * ```js
 * // WordPress dependencies
 * import { controls } from '@wordpress/data-controls';
 * import { registerStore } from '@wordpress/data';
 *
 * // Internal dependencies
 * import reducer from './reducer';
 * import * as selectors from './selectors';
 * import * as actions from './actions';
 * import * as resolvers from './resolvers';
 *
 * registerStore( 'my-custom-store', {
 * reducer,
 * controls,
 * actions,
 * selectors,
 * resolvers,
 * } );
 * ```
 * @return {Object} An object for registering the default controls with the
 * store.
 */
export const controls = {
	AWAIT_PROMISE: ( { promise } ) => promise,
	API_FETCH( { request } ) {
		return triggerFetch( request );
	},
};
