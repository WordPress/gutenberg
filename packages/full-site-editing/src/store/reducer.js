/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Reducer returning the default template types.
 *
 * @param {Array} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function defaultTemplateTypes( state = [], action ) {
	if ( action?.type === 'UPDATE_DEFAULT_TEMPLATE_TYPES' ) {
		return {
			...state,
			...action.defaultTemplateTypes,
		};
	}

	return state;
}

export default combineReducers( {
	defaultTemplateTypes,
} );
