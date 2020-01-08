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
		filterValue: undefined,
		isRequestingDownloadableBlocks: true,
	},
	action
) => {
	switch ( action.type ) {
		case 'FETCH_DOWNLOADABLE_BLOCKS':
			return {
				...state,
				isRequestingDownloadableBlocks: true,
			};
		case 'RECEIVE_DOWNLOADABLE_BLOCKS':
			return {
				...state,
				results: Object.assign( {}, state.results, {
					[ action.filterValue ]: action.downloadableBlocks,
				} ),
				isRequestingDownloadableBlocks: false,
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
export const errorNotices = ( state = {
	notices: {},
}, action ) => {
	switch ( action.type ) {
		case 'SET_ERROR_NOTICE_ID' :
			return {
				...state,
				notices: Object.assign( {}, state.notices, {
					[ action.blockId ]: action.noticeId,
				} ),
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
