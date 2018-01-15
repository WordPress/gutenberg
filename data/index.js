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
 * Registers a new sub reducer to the global state and returns a Redux-like store object.
 *
 * @param {String}  key     Reducer key
 * @param {Object}  reducer Reducer function
 *
 * @returns {Object} Store Object.
 */
export function registerReducer( key, reducer ) {
	reducers[ key ] = reducer;
	store.replaceReducer( combineReducers( reducers ) );
	const getState = () => store.getState()[ key ];

	return {
		dispatch: store.dispatch,
		subscribe( listener ) {
			let previousState = getState();
			const unsubscribe = store.subscribe( () => {
				const newState = getState();
				if ( newState !== previousState ) {
					listener();
					previousState = newState;
				}
			} );

			return unsubscribe;
		},
		getState,
	};
}
