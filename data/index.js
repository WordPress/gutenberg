/**
 * External dependencies
 */
import { createStore, combineReducers } from 'redux';
import { flowRight } from 'lodash';

/**
 * Module constants
 */
const reducers = {};
const enhancers = [];
if ( window.__REDUX_DEVTOOLS_EXTENSION__ ) {
	enhancers.push( window.__REDUX_DEVTOOLS_EXTENSION__() );
}

const initialReducer = () => ( {} );
const store = createStore( initialReducer, {}, flowRight( enhancers ) );

/**
 * Registers a new sub reducer to the global state
 *
 * @param {String} key     Reducer key
 * @param {Object} reducer Reducer function
 */
export function registerReducer( key, reducer ) {
	reducers[ key ] = reducer;
	store.replaceReducer( combineReducers( reducers ) );
}

export const subscribe = store.subscribe;

export const dispatch = store.dispatch;

export const getState = store.getState;
