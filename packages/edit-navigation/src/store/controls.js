/**
 * WordPress dependencies
 */
import { createRegistryControl } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { menuItemsQuery } from './utils';

/**
 * Resolves menu items for given menu id.
 *
 * @param {number} menuId Menu ID.
 * @return {Object} Action.
 */
export function resolveMenuItems( menuId ) {
	return {
		type: 'RESOLVE_MENU_ITEMS',
		query: menuItemsQuery( menuId ),
	};
}

/**
 * Dispatches an action using chosen registry.
 *
 * @param {string} registryName Registry name.
 * @param {string} actionName   Action name.
 * @param {Array}  args         Selector arguments.
 * @return {Object} control descriptor.
 */
export function dispatch( registryName, actionName, ...args ) {
	return {
		type: 'DISPATCH',
		registryName,
		actionName,
		args,
	};
}

const controls = {
	DISPATCH: createRegistryControl(
		( registry ) => ( { registryName, actionName, args } ) => {
			return registry.dispatch( registryName )[ actionName ]( ...args );
		}
	),

	RESOLVE_MENU_ITEMS: createRegistryControl(
		( registry ) => ( { query } ) => {
			return registry.resolveSelect( 'core' ).getMenuItems( query );
		}
	),
};

export default controls;
