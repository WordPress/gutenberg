/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

export function guides( state = [], action ) {
	switch ( action.type ) {
		case 'TRIGGER_GUIDE':
			return [
				...state,
				action.tipIds,
			];
	}

	return state;
}

export function areTipsDisabled( state = false, action ) {
	switch ( action.type ) {
		case 'DISABLE_TIPS':
			return true;
	}

	return state;
}

export function dismissedTips( state = {}, action ) {
	switch ( action.type ) {
		case 'DISMISS_TIP':
			return {
				...state,
				[ action.id ]: true,
			};
	}

	return state;
}

const preferences = combineReducers( { areTipsDisabled, dismissedTips } );

export default combineReducers( { guides, preferences } );
