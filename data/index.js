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
const store = createStore( dynamicReducer, {}, flowRight( enhancers ) );

/**
 * Reducer function combining the dynamic "reducers" array
 *
 * @param {Object} state  Global state
 * @param {Object} action Action
 *
 * @return {Object}       Updated global state
 */
function dynamicReducer( state = {}, action ) {
	let hasChanges = false;
	const newState = {};
	reducers.forEach( ( { key, reducer } ) => {
		const newSubState = reducer( state[ key ] || {}, action );
		hasChanges = hasChanges || newSubState !== state[ key ];
		newState[ key ] = newSubState;
	} );

	return hasChanges ? newState : state;
}

/**
 * Register a new sub reducer to the global sate
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
