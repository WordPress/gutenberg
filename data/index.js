/**
 * External dependencies
 */
import { createStore } from 'redux';
import { flowRight } from 'lodash';

/**
 * Module constants
 */
const reducers = [];
const enhancers = [];
if ( window.__REDUX_DEVTOOLS_EXTENSION__ ) {
	enhancers.push( window.__REDUX_DEVTOOLS_EXTENSION__() );
}

/**
 * Combines the dynamic "reducers" array to create one reducer
 *
 * @param {Object} state  Global state
 * @param {Object} action Action
 *
 * @return {Object}       Updated global state
 */
function dynamicReducer( state = {}, action ) {
	let hasChanged = false;
	const nextState = {};
	for ( let i = 0; i < reducers.length; i++ ) {
		const { key, reducer } = reducers[ i ];
		const previousStateForKey = state[ key ];
		const nextStateForKey = reducer( previousStateForKey, action );
		nextState[ key ] = nextStateForKey;
		hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
	}
	return hasChanged ? nextState : state;
}

const store = createStore( dynamicReducer, {}, flowRight( enhancers ) );

/**
 * Registers a new sub reducer to the global state
 *
 * @param {String} key     Reducer key
 * @param {Object} reducer Reducer function
 */
export function registerReducer( key, reducer ) {
	reducers.push( { key, reducer } );
	store.dispatch( { type: 'NEW_REDUCER', key, reducer } );
}

export const subscribe = store.subscribe;

export const dispatch = store.dispatch;

export const getState = store.getState;
