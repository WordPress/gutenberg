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
export const downloadableBlocks = ( state = {}, action ) => {
	switch ( action.type ) {
		case 'FETCH_DOWNLOADABLE_BLOCKS':
			return {
				...state,
				[ action.filterValue ]: {
					isRequesting: true,
				},
			};
		case 'RECEIVE_DOWNLOADABLE_BLOCKS':
			return {
				...state,
				[ action.filterValue ]: {
					results: action.downloadableBlocks,
					isRequesting: false,
				},
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
				[ action.blockId ]: {
					message: action.message,
					isFatal: action.isFatal,
				},
			};
		case 'CLEAR_ERROR_NOTICE':
			const { [ action.blockId ]: blockId, ...restState } = state;
			return restState;
	}
	return state;
};

export default combineReducers( {
	downloadableBlocks,
	blockManagement,
	errorNotices,
} );
