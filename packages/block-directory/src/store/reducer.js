/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Reducer returning an array of downloadable blocks.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export const downloadableBlocks = (
	state = {
		results: {},
		pendingSearchRequests: 0,
	},
	action
) => {
	switch ( action.type ) {
		case 'FETCH_DOWNLOADABLE_BLOCKS':
			return {
				...state,
				pendingSearchRequests: state.pendingSearchRequests + 1,
			};
		case 'RECEIVE_DOWNLOADABLE_BLOCKS':
			return {
				...state,
				results: {
					...state.results,
					[ action.filterValue ]: action.downloadableBlocks,
				},
				pendingSearchRequests: state.pendingSearchRequests - 1,
			};
	}
	return state;
};

/**
 * Reducer managing the installation and deletion of blocks.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export const blockManagement = (
	state = {
		installedBlockTypes: [],
		isInstalling: {},
	},
	action
) => {
	switch ( action.type ) {
		case 'ADD_INSTALLED_BLOCK_TYPE':
			return {
				...state,
				installedBlockTypes: [
					...state.installedBlockTypes,
					action.item,
				],
			};
		case 'REMOVE_INSTALLED_BLOCK_TYPE':
			return {
				...state,
				installedBlockTypes: state.installedBlockTypes.filter(
					( blockType ) => blockType.name !== action.item.name
				),
			};
		case 'SET_INSTALLING_BLOCK':
			return {
				...state,
				isInstalling: {
					...state.isInstalling,
					[ action.blockId ]: action.isInstalling,
				},
			};
	}
	return state;
};

/**
 * Reducer returning an array of downloadable blocks.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function hasPermission( state = true, action ) {
	if ( action.type === 'SET_INSTALL_BLOCKS_PERMISSION' ) {
		return action.hasPermission;
	}

	return state;
}

/**
 * Reducer returning an object of error notices.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export const errorNotices = ( state = {}, action ) => {
	switch ( action.type ) {
		case 'SET_ERROR_NOTICE':
			return {
				...state,
				[ action.blockId ]: action.notice,
			};
	}
	return state;
};

export default combineReducers( {
	downloadableBlocks,
	blockManagement,
	hasPermission,
	errorNotices,
} );
