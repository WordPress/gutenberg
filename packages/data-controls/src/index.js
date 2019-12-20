/**
 * WordPress dependencies
 */
import triggerFetch from '@wordpress/api-fetch';
import { createRegistryControl } from '@wordpress/data';

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
export const apiFetch = ( request ) => {
	return {
		type: 'API_FETCH',
		request,
	};
};

/**
 * Dispatches a control action for triggering a registry select.
 *
 * Note: when this control action is handled, it automatically considers
 * selectors that may have a resolver. It will await and return the resolved
 * value when the selector has not been resolved yet.
 *
 * @param {string} storeKey      The key for the store the selector belongs to
 * @param {string} selectorName  The name of the selector
 * @param {Array}  args          Arguments for the select.
 *
 * @example
 * ```js
 * import { select } from '@wordpress/data-controls';
 *
 * // Action generator using select
 * export function* myAction() {
 * 	const isSidebarOpened = yield select( 'core/edit-post', 'isEditorSideBarOpened' );
 * 	// do stuff with the result from the select.
 * }
 * ```
 *
 * @return {Object} The control descriptor.
 */
export function select( storeKey, selectorName, ...args ) {
	return {
		type: 'SELECT',
		storeKey,
		selectorName,
		args,
	};
}

/**
 * Dispatches a control action for triggering a registry dispatch.
 *
 * @param {string} storeKey    The key for the store the action belongs to
 * @param {string} actionName  The name of the action to dispatch
 * @param {Array}  args        Arguments for the dispatch action.
 *
 * @example
 * ```js
 * import { dispatch } from '@wordpress/data-controls';
 *
 * // Action generator using dispatch
 * export function* myAction() {
 * 	yield dispatch( 'core/edit-post', 'togglePublishSidebar' );
 * 	// do some other things.
 * }
 * ```
 *
 * @return {Object}  The control descriptor.
 */
export function dispatch( storeKey, actionName, ...args ) {
	return {
		type: 'DISPATCH',
		storeKey,
		actionName,
		args,
	};
}

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
 * 	reducer,
 * 	controls,
 * 	actions,
 * 	selectors,
 * 	resolvers,
 * } );
 * ```
 *
 * @return {Object} An object for registering the default controls with the
 *                  store.
 */
export const controls = {
	API_FETCH( { request } ) {
		return triggerFetch( request );
	},
	SELECT: createRegistryControl(
		( registry ) => ( { storeKey, selectorName, args } ) => {
			return registry[
				registry.select( storeKey )[ selectorName ].hasResolver ?
					'__experimentalResolveSelect' :
					'select'
			]( storeKey )[ selectorName ]( ...args );
		}
	),
	DISPATCH: createRegistryControl(
		( registry ) => ( { storeKey, actionName, args } ) => {
			return registry.dispatch( storeKey )[ actionName ]( ...args );
		}
	),
};
