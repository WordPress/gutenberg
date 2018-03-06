/**
 * External dependencies
 */
import { uniqBy } from 'lodash';
import { combineReducers } from 'redux';

/**
 * Reducer returning the categories list.
 *
 * @param {Object}  state                 Current state.
 * @param {Object}  action                Dispatched action.
 *
 * @return {string} Updated state.
 */
function categories( state = [], action ) {
	switch ( action.type ) {
		case 'RECEIVE_CATEGORIES':
			return uniqBy(
				[
					...action.categories,
					...state,
				],
				( category ) => category.id
			);
	}

	return state;
}

export default combineReducers( { categories } );
