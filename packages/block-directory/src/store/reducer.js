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
export const downloadableBlocks = ( state = {
	results: {},
	hasPermission: true,
	filterValue: undefined,
	isRequestingDownloadableBlocks: true,
	isInstalling: false,
	installedBlockTypes: [],
}, action ) => {
	switch ( action.type ) {
		case 'FETCH_DOWNLOADABLE_BLOCKS' :
			return {
				...state,
				isRequestingDownloadableBlocks: true,
			};
		case 'RECEIVE_DOWNLOADABLE_BLOCKS' :
			return {
				...state,
				results: Object.assign( {}, state.results, {
					[ action.filterValue ]: action.downloadableBlocks,
				} ),
				hasPermission: true,
				isRequestingDownloadableBlocks: false,
			};
		case 'SET_INSTALL_BLOCKS_PERMISSION' :
			return {
				...state,
				items: action.hasPermission ? state.items : [],
				hasPermission: action.hasPermission,
			};
		case 'FETCH_INSTALL_BLOCK' :
		case 'RECEIVE_INSTALL_BLOCKS':
			return {
				...state,
				isInstalling: action.isInstalling,
			};
		case 'ADD_INSTALLED_BLOCK_TYPE' :
			return {
				...state,
				installedBlockTypes: [ ...state.installedBlockTypes, action.item ],
			};

		case 'REMOVE_INSTALLED_BLOCK_TYPE' :
			return {
				...state,
				installedBlockTypes: state.installedBlockTypes.filter( ( blockType ) => blockType.name !== action.item.name ),
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
	errorNotices,
} );
