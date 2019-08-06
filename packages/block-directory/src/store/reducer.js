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
export const discoverBlocks = ( state = { results: {}, hasPermission: undefined, filterValue: undefined, isRequestingDiscoverBlocks: true }, action ) => {
	switch ( action.type ) {
		case 'FETCH_DISCOVER_BLOCKS' :
			return {
				...state,
				isRequestingDiscoverBlocks: true,
			};
		case 'RECEIVE_DISCOVER_BLOCKS' :
			return {
				...state,
				results: Object.assign( {}, state.results, {
					[ action.filterValue ]: action.discoverBlocks,
				} ),
				hasPermission: true,
				isRequestingDiscoverBlocks: false,
			};
		case 'SET_INSTALL_BLOCKS_PERMISSION' :
			return {
				...state,
				items: action.hasPermission ? state.items : [],
				hasPermission: action.hasPermission,
				isRequestingDiscoverBlocks: false,
			};
	}
	return state;
};

export default combineReducers( {
	discoverBlocks,
} );
