/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Reducer returning an array of discover blocks.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export const discoverBlocks = ( state = {
	results: {},
	hasPermission: undefined,
	filterValue: undefined,
	isRequestingDownloadableBlocks: true,
	installedBlockTypes: [],
}, action ) => {
	switch ( action.type ) {
		case 'FETCH_DISCOVER_BLOCKS' :
			return {
				...state,
				isRequestingDownloadableBlocks: true,
			};
		case 'RECEIVE_DISCOVER_BLOCKS' :
			return {
				...state,
				results: Object.assign( {}, state.results, {
					[ action.filterValue ]: action.discoverBlocks,
				} ),
				hasPermission: true,
				isRequestingDownloadableBlocks: false,
			};
		case 'SET_INSTALL_BLOCKS_PERMISSION' :
			return {
				...state,
				items: action.hasPermission ? state.items : [],
				hasPermission: action.hasPermission,
				isRequestingDownloadableBlocks: false,
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

export default combineReducers( {
	discoverBlocks,
} );
