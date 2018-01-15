/*
 * External dependencies
 */
import { connect } from 'react-redux';
import { createStore, combineReducers } from 'redux';
import { flowRight } from 'lodash';

/**
 * @module wp.data
 */

/*
 * Module constants
 */
const reducers = {};
const selectors = {};
const enhancers = [];
if ( window.__REDUX_DEVTOOLS_EXTENSION__ ) {
	enhancers.push( window.__REDUX_DEVTOOLS_EXTENSION__() );
}

const initialReducer = () => ( {} );
const store = createStore( initialReducer, {}, flowRight( enhancers ) );

/**
 * Registers a new sub reducer to the global state and returns a Redux-like
 * store object.
 *
 * @param {string}  key     Reducer key.
 * @param {Object}  reducer Reducer function.
 *
 * @returns {Object}        Store Object.
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

/**
 * Registers a single selector for a redux state component.
 *
 * @param {string}   reducerKey Part of the state shape to register the selector for.
 * @param {string}   selectorKey Name of the public name for the selector.
 * @param {Function} selector The selector function. Get's passed the sliced state as its first argument.
 */
export function registerSelector( reducerKey, selectorKey, selector ) {
	if ( ! selectors.hasOwnProperty( reducerKey ) ) {
		selectors[ reducerKey ] = {};
	}

	selectors[ reducerKey ][ selectorKey ] = ( ...args ) => {
		return selector( store.getState()[ reducerKey ], ...args );
	};
}

/**
 * Registers selectors for external usage.
 *
 * @param {string} reducerKey          Part of the state shape to register the
 *                                     selectors for.
 * @param {Object} registeredSelectors Selectors to register. Keys will be used
 *                                     as the public facing API. Selectors will
 *                                     get passed the state as first argument.
 */
export function registerSelectors( reducerKey, registeredSelectors ) {
	for ( const [ selectorKey, selector ] of Object.entries( registeredSelectors ) ) {
		registerSelector( reducerKey, selectorKey, selector );
	}
}

/**
 * Adds data to a component.
 *
 * @param {Function} mapSelectorsToProps Get's called with the selectors object
 *                                       to determine the data for the component.
 *
 * @returns {ReactElement} Renders the wrapped component and passes it data.
 */
export const query = ( mapSelectorsToProps ) => ( WrappedComponent ) => {
	return connect( ( state, ownProps ) => {
		return mapSelectorsToProps( selectors, ownProps );
	} )( WrappedComponent );
};

export {
	selectors,
};
