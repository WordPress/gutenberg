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

export function patternCategories( state = [], action ) {
	switch ( action.type ) {
		case 'RECEIVE_PATTERN_CATEGORIES':
			return action.patternCategories;
	}

	return state;
}

export default combineReducers( {
	isEditingPattern,
	patternCategories,
} );
