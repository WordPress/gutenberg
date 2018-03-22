/** @format */
import { createStore, combineReducers } from 'redux';
import { reducer } from './reducers';

export const reducers = combineReducers( {
	reducer,
} );

export function setupStore( initialState = {} ) {
	const store = createStore( reducers, initialState );
	return store;
}
