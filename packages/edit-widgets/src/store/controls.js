/**
 * WordPress dependencies
 */
import { createRegistryControl } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { buildWidgetAreasQuery, KIND, WIDGET_AREA_ENTITY_TYPE } from './utils';

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
 * Returns a list of pending actions for given id.
 *
 * @param {number} editorId Post ID.
 * @return {Array} List of pending actions.
 */
export function getPendingActions( editorId ) {
	return {
		type: 'GET_PENDING_ACTIONS',
		editorId,
	};
}

/**
 * Returns boolean indicating whether or not an action processing specified
 * editor is currently running.
 *
 * @param {number} editorId Post ID.
 * @return {Object} Action.
 */
export function isProcessingPost( editorId ) {
	return {
		type: 'IS_PROCESSING_ENTITY',
		editorId,
	};
}

/**
 * Selects widgetId -> clientId mapping (necessary for saving widgets).
 *
 * @return {Object} Action.
 */
export function getWidgetToClientIdMapping() {
	return {
		type: 'GET_WIDGET_TO_CLIENT_ID_MAPPING',
	};
}

/**
 * Resolves menu items for given menu id.
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
	SELECT: createRegistryControl(
		( registry ) => ( { registryName, selectorName, args } ) => {
			return registry.select( registryName )[ selectorName ]( ...args );
		}
	),

	GET_PENDING_ACTIONS: createRegistryControl(
		( registry ) => ( { editorId } ) => {
			return (
				getState( registry ).processingQueue[ editorId ]
					?.pendingActions || []
			);
		}
	),

	IS_PROCESSING_ENTITY: createRegistryControl(
		( registry ) => ( { editorId } ) => {
			return getState( registry ).processingQueue[ editorId ]?.inProgress;
		}
	),

	GET_WIDGET_TO_CLIENT_ID_MAPPING: createRegistryControl(
		( registry ) => () => {
			return getState( registry ).mapping || {};
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
				.__experimentalResolveSelect( 'core' )
				.getEntityRecords( KIND, WIDGET_AREA_ENTITY_TYPE, query );
		}
	),
};

const getState = ( registry ) =>
	registry.stores[ 'core/edit-widgets' ].store.getState();

export default controls;
