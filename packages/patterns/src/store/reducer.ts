import { combineReducers } from '@wordpress/data';
import type { Action, State } from './types';

export function isEditingPattern(
	state: State[ 'isEditingPattern' ] = {},
	action: Action
): State[ 'isEditingPattern' ] {
	if ( action?.type === 'SET_EDITING_PATTERN' ) {
		return {
			...state,
			[ action.clientId ]: action.isEditing,
		};
	}

	return state;
}

export default combineReducers( {
	isEditingPattern,
} );
