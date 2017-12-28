import { combineReducers } from 'redux';

/**
 * Reducer to keep track of the global state of the NUX
 *
 * @param  {Object} state  Current state
 * @param  {Object} action Dispatched action
 * @return {Object}        Updated state
 */
function enabled( state = true, action ) {
	if ( action.type === 'core/nux/ENABLE' ) {
		return true;
	} else if ( action.type === 'core/nux/DISABLE' ) {
		return false;
	}

	return state;
}

/**
 * Reducer to keep track of the several NUX tips
 *
 * @param  {Object} state  Current state
 * @param  {Object} action Dispatched action
 * @return {Object}        Updated state
 */
function tips( state = {}, action ) {
	if ( action.type === 'core/nux/MARK_AS_SHOWN' ) {
		return {
			...state,
			[ action.tipId ]: true,
		};
	}

	return state;
}

const nux = combineReducers( { enabled, tips } );

export default combineReducers( { nux } );
