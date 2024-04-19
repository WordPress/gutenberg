/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

export function isEditingPattern( state = {}, action ) {
	if ( action?.type === 'SET_EDITING_PATTERN' ) {
		return {
			...state,
			[ action.clientId ]: action.isEditing,
		};
	}

	return state;
}

export function renamingBlock( state = null, action ) {
	if ( action?.type === 'SET_RENAMING_BLOCK' ) {
		return action.clientId;
	}

	return state;
}

export default combineReducers( {
	isEditingPattern,
	renamingBlock,
} );
