/**
 * WordPress dependencies
 */
import { default as triggerApiFetch } from '@wordpress/api-fetch';
import { createRegistryControl } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { menuItemsQuery } from './utils';

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

export function getPendingActions( postId ) {
	return {
		type: 'GET_PENDING_ACTIONS',
		postId,
	};
}

export function isProcessingPost( postId ) {
	return {
		type: 'IS_PROCESSING_POST',
		postId,
	};
}

export function getMenuItemToClientIdMapping( postId ) {
	return {
		type: 'GET_MENU_ITEM_TO_CLIENT_ID_MAPPING',
		postId,
	};
}

export function getNavigationPostForMenu( menuId ) {
	return {
		type: 'SELECT',
		registryName: 'core/edit-navigation',
		selectorName: 'getNavigationPostForMenu',
		args: [ menuId ],
	};
}

export function resolveMenuItems( menuId ) {
	return {
		type: 'RESOLVE_MENU_ITEMS',
		query: menuItemsQuery( menuId ),
	};
}

/**
 * Calls a selector using chosen registry.
 *
 * @param {string} registryName Registry name.
 * @param {string} selectorName Selector name.
 * @param {Array} args          Selector arguments.
 * @return {Object} control descriptor.
 */
export function select( registryName, selectorName, ...args ) {
	return {
		type: 'SELECT',
		registryName,
		selectorName,
		args,
	};
}

/**
 * Dispatches an action using chosen registry.
 *
 * @param {string} registryName Registry name.
 * @param {string} actionName   Action name.
 * @param {Array} args          Selector arguments.
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
	API_FETCH( { request } ) {
		return triggerApiFetch( request );
	},

	SELECT: createRegistryControl(
		( registry ) => ( { registryName, selectorName, args } ) => {
			return registry.select( registryName )[ selectorName ]( ...args );
		}
	),

	GET_PENDING_ACTIONS: createRegistryControl(
		( registry ) => ( { postId } ) => {
			return (
				getState( registry ).processingQueue[ postId ]
					?.pendingActions || []
			);
		}
	),

	IS_PROCESSING_POST: createRegistryControl(
		( registry ) => ( { postId } ) => {
			return getState( registry ).processingQueue[ postId ]?.inProgress;
		}
	),

	GET_MENU_ITEM_TO_CLIENT_ID_MAPPING: createRegistryControl(
		( registry ) => ( { postId } ) => {
			return getState( registry ).mapping[ postId ] || {};
		}
	),

	DISPATCH: createRegistryControl(
		( registry ) => ( { registryName, actionName, args } ) => {
			return registry.dispatch( registryName )[ actionName ]( ...args );
		}
	),

	RESOLVE_MENU_ITEMS: createRegistryControl(
		( registry ) => ( { query } ) => {
			return registry
				.__experimentalResolveSelect( 'core' )
				.getMenuItems( query );
		}
	),
};

const getState = ( registry ) =>
	registry.stores[ 'core/edit-navigation' ].store.getState();

export default controls;
