/**
 * Internal dependencies
 */
import { createRegistryControl } from './factory';
import type { StoreDescriptor } from './types';

const SELECT = '@@data/SELECT';
const RESOLVE_SELECT = '@@data/RESOLVE_SELECT';
const DISPATCH = '@@data/DISPATCH';

function isStoreDescriptor( object: unknown ): object is StoreDescriptor {
	return object !== null && typeof object === 'object';
}

/**
 * Dispatches a control action for triggering a synchronous registry select.
 *
 * Note: This control synchronously returns the current selector value, triggering the
 * resolution, but not waiting for it.
 *
 * @param storeNameOrDescriptor Unique namespace identifier for the store
 * @param selectorName          The name of the selector.
 * @param args                  Arguments for the selector.
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
 * @return The control descriptor.
 */
function select(
	storeNameOrDescriptor: string | StoreDescriptor,
	selectorName: string,
	...args: unknown[]
) {
	return {
		type: SELECT,
		storeKey: isStoreDescriptor( storeNameOrDescriptor )
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
 * @param storeNameOrDescriptor Unique namespace identifier for the store
 * @param selectorName          The name of the selector
 * @param args                  Arguments for the selector.
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
 * @return The control descriptor.
 */
function resolveSelect(
	storeNameOrDescriptor: string | StoreDescriptor< any >,
	selectorName: string,
	...args: any[]
) {
	return {
		type: RESOLVE_SELECT,
		storeKey: isStoreDescriptor( storeNameOrDescriptor )
			? storeNameOrDescriptor.name
			: storeNameOrDescriptor,
		selectorName,
		args,
	};
}

/**
 * Dispatches a control action for triggering a registry dispatch.
 *
 * @param storeNameOrDescriptor Unique namespace identifier for the store
 * @param actionName            The name of the action to dispatch
 * @param args                  Arguments for the dispatch action.
 *
 * @example
 * ```js
 * import { controls } from '@wordpress/data-controls';
 *
 * // Action generator using dispatch
 * export function* myAction() {
 *   yield controls.dispatch( 'core/editor', 'togglePublishSidebar' );
 *   // do some other things.
 * }
 * ```
 *
 * @return   The control descriptor.
 */
function dispatch(
	storeNameOrDescriptor: string | StoreDescriptor,
	actionName: string,
	...args: unknown[]
) {
	return {
		type: DISPATCH,
		storeKey: isStoreDescriptor( storeNameOrDescriptor )
			? storeNameOrDescriptor.name
			: storeNameOrDescriptor,
		actionName,
		args,
	};
}

export const controls = { select, resolveSelect, dispatch };

type SelectorControlArgs = {
	storeKey: string;
	selectorName: string;
	args: unknown[];
};

type ActionControlArgs = {
	storeKey: string;
	actionName: string;
	args: unknown[];
};

export const builtinControls = {
	[ SELECT ]: createRegistryControl(
		( registry ) =>
			( { storeKey, selectorName, args }: SelectorControlArgs ) =>
				registry.select( storeKey )[ selectorName ]( ...args )
	),
	[ RESOLVE_SELECT ]: createRegistryControl(
		( registry ) =>
			( { storeKey, selectorName, args }: SelectorControlArgs ) => {
				const selector = registry.select( storeKey )[
					selectorName
				] as ( ( ...a: any[] ) => any ) & {
					hasResolver?: boolean;
				};
				const method = selector.hasResolver
					? 'resolveSelect'
					: 'select';
				return registry[ method ]( storeKey )[ selectorName ](
					...args
				);
			}
	),
	[ DISPATCH ]: createRegistryControl(
		( registry ) =>
			( { storeKey, actionName, args }: ActionControlArgs ) =>
				registry.dispatch( storeKey )[ actionName ]( ...args )
	),
};
