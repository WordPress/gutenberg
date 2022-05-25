/**
 * External dependencies
 */
import { isObject } from 'lodash';

/**
 * Internal dependencies
 */
import { createRegistryControl } from './factory';

/** @typedef {import('./types').StoreDescriptor} StoreDescriptor */

const SELECT = '@@data/SELECT';
const RESOLVE_SELECT = '@@data/RESOLVE_SELECT';
const DISPATCH = '@@data/DISPATCH';

/**
 * Dispatches a control action for triggering a synchronous registry select.
 *
 * Note: This control synchronously returns the current selector value, triggering the
 * resolution, but not waiting for it.
 *
 * @param {string|StoreDescriptor} storeNameOrDescriptor Unique namespace identifier for the store
 * @param {string}                 selectorName          The name of the selector.
 * @param {Array}                  args                  Arguments for the selector.
 *
 * @example
 * ```js
 * import { controls } from '@wordpress/data';
 *
 * // Action generator using `select`.
 * export function* myAction() {
 *   const isEditorSideBarOpened = yield controls.select( 'core/edit-post', 'isEditorSideBarOpened' );
 *   // Do stuff with the result from the `select`.
 * }
 * ```
 *
 * @return {Object} The control descriptor.
 */
function select( storeNameOrDescriptor, selectorName, ...args ) {
	return {
		type: SELECT,
		storeKey: isObject( storeNameOrDescriptor )
			? storeNameOrDescriptor.name
			: storeNameOrDescriptor,
		selectorName,
		args,
	};
}

/**
 * Dispatches a control action for triggering and resolving a registry select.
 *
 * Note: when this control action is handled, it automatically considers
 * selectors that may have a resolver. In such case, it will return a `Promise` that resolves
 * after the selector finishes resolving, with the final result value.
 *
 * @param {string|StoreDescriptor} storeNameOrDescriptor Unique namespace identifier for the store
 * @param {string}                 selectorName          The name of the selector
 * @param {Array}                  args                  Arguments for the selector.
 *
 * @example
 * ```js
 * import { controls } from '@wordpress/data';
 *
 * // Action generator using resolveSelect
 * export function* myAction() {
 * 	const isSidebarOpened = yield controls.resolveSelect( 'core/edit-post', 'isEditorSideBarOpened' );
 * 	// do stuff with the result from the select.
 * }
 * ```
 *
 * @return {Object} The control descriptor.
 */
function resolveSelect( storeNameOrDescriptor, selectorName, ...args ) {
	return {
		type: RESOLVE_SELECT,
		storeKey: isObject( storeNameOrDescriptor )
			? storeNameOrDescriptor.name
			: storeNameOrDescriptor,
		selectorName,
		args,
	};
}

/**
 * Dispatches a control action for triggering a registry dispatch.
 *
 * @param {string|StoreDescriptor} storeNameOrDescriptor Unique namespace identifier for the store
 * @param {string}                 actionName            The name of the action to dispatch
 * @param {Array}                  args                  Arguments for the dispatch action.
 *
 * @example
 * ```js
 * import { controls } from '@wordpress/data-controls';
 *
 * // Action generator using dispatch
 * export function* myAction() {
 *   yield controls.dispatch( 'core/edit-post', 'togglePublishSidebar' );
 *   // do some other things.
 * }
 * ```
 *
 * @return {Object}  The control descriptor.
 */
function dispatch( storeNameOrDescriptor, actionName, ...args ) {
	return {
		type: DISPATCH,
		storeKey: isObject( storeNameOrDescriptor )
			? storeNameOrDescriptor.name
			: storeNameOrDescriptor,
		actionName,
		args,
	};
}

export const controls = { select, resolveSelect, dispatch };

export const builtinControls = {
	[ SELECT ]: createRegistryControl(
		( registry ) => ( { storeKey, selectorName, args } ) =>
			registry.select( storeKey )[ selectorName ]( ...args )
	),
	[ RESOLVE_SELECT ]: createRegistryControl(
		( registry ) => ( { storeKey, selectorName, args } ) => {
			const method = registry.select( storeKey )[ selectorName ]
				.hasResolver
				? 'resolveSelect'
				: 'select';
			return registry[ method ]( storeKey )[ selectorName ]( ...args );
		}
	),
	[ DISPATCH ]: createRegistryControl(
		( registry ) => ( { storeKey, actionName, args } ) =>
			registry.dispatch( storeKey )[ actionName ]( ...args )
	),
};
