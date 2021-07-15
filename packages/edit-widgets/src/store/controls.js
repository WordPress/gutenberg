/**
 * WordPress dependencies
 */
import { createRegistryControl } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	buildWidgetAreasQuery,
	buildWidgetsQuery,
	KIND,
	WIDGET_AREA_ENTITY_TYPE,
} from './utils';
import { STORE_NAME as editWidgetsStoreName } from './constants';

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
 * Returns a list of pending actions for given post id.
 *
 * @param {number} postId Post ID.
 * @return {Array} List of pending actions.
 */
export function getPendingActions( postId ) {
	return {
		type: 'GET_PENDING_ACTIONS',
		postId,
	};
}

/**
 * Returns boolean indicating whether or not an action processing specified
 * post is currently running.
 *
 * @param {number} postId Post ID.
 * @return {Object} Action.
 */
export function isProcessingPost( postId ) {
	return {
		type: 'IS_PROCESSING_POST',
		postId,
	};
}

/**
 * Resolves navigation post for given menuId.
 *
 * @see selectors.js
 * @param {number} menuId Menu ID.
 * @return {Object} Action.
 */
export function getNavigationPostForMenu( menuId ) {
	return {
		type: 'SELECT',
		registryName: 'core/edit-navigation',
		selectorName: 'getNavigationPostForMenu',
		args: [ menuId ],
	};
}

/**
 * Resolves widget areas.
 *
 * @param {Object} query Query.
 * @return {Object} Action.
 */
export function resolveWidgetAreas( query = buildWidgetAreasQuery() ) {
	return {
		type: 'RESOLVE_WIDGET_AREAS',
		query,
	};
}

/**
 * Resolves widgets.
 *
 * @param {Object} query Query.
 * @return {Object} Action.
 */
export function resolveWidgets( query = buildWidgetsQuery() ) {
	return {
		type: 'RESOLVE_WIDGETS',
		query,
	};
}

/**
 * Calls a selector using chosen registry.
 *
 * @param {string} registryName Registry name.
 * @param {string} selectorName Selector name.
 * @param {Array}  args         Selector arguments.
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
	AWAIT_PROMISE: ( { promise } ) => promise,

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

	DISPATCH: createRegistryControl(
		( registry ) => ( { registryName, actionName, args } ) => {
			return registry.dispatch( registryName )[ actionName ]( ...args );
		}
	),

	RESOLVE_WIDGET_AREAS: createRegistryControl(
		( registry ) => ( { query } ) => {
			return registry
				.resolveSelect( 'core' )
				.getEntityRecords( KIND, WIDGET_AREA_ENTITY_TYPE, query );
		}
	),

	RESOLVE_WIDGETS: createRegistryControl( ( registry ) => ( { query } ) => {
		return registry
			.resolveSelect( 'core' )
			.getEntityRecords( 'root', 'widget', query );
	} ),
};

const getState = ( registry ) =>
	registry.stores[ editWidgetsStoreName ].store.getState();

export default controls;
