/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { createStore, combineReducers } from 'redux';
import { flowRight } from 'lodash';

/**
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
 * Registers a new sub reducer to the global state and returns a Redux-like store object.
 *
 * @param {string}  reducerKey Reducer key.
 * @param {Object}  reducer    Reducer function.
 *
 * @returns {Object}           Store Object.
 */
export function registerReducer( reducerKey, reducer ) {
	reducers[ reducerKey ] = reducer;
	store.replaceReducer( combineReducers( reducers ) );
	const getState = () => store.getState()[ reducerKey ];

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
 * Registers selectors for external usage.
 *
 * @param {string} reducerKey          Part of the state shape to register the
 *                                     selectors for.
 * @param {Object} newSelectors        Selectors to register. Keys will be used
 *                                     as the public facing API. Selectors will
 *                                     get passed the state as first argument.
 */
export function registerSelectors( reducerKey, newSelectors ) {
	selectors[ reducerKey ] = newSelectors;
}

/**
 * Higher Order Component used to inject data using the registered selectors.
 *
 * @param {Function} mapSelectorsToProps Get's called with the selectors object
 *                                       to determine the data for the component.
 *
 * @returns {Func}                       Renders the wrapped component and passes it data.
 */
export const query = ( mapSelectorsToProps ) => ( WrappedComponent ) => {
	const connectWithStore = ( ...args ) => {
		const ConnectedWrappedComponent = connect( ...args )( WrappedComponent );
		return ( props ) => {
			return <ConnectedWrappedComponent { ...props } store={ store } />;
		};
	};

	return connectWithStore( ( state, ownProps ) => {
		const select = ( key, selectorName, ...args ) => {
			return selectors[ key ][ selectorName ]( state[ key ], ...args );
		};

		return mapSelectorsToProps( select, ownProps );
	} );
};

/**
 * Calls a selector given the current state and extra arguments.
 *
 * @param {string} reducerKey   Part of the state shape to register the
 *                              selectors for.
 * @param {string} selectorName Selector name.
 * @param {*}      args         Selectors args.
 *
 * @returns {*}                 The selector's returned value.
 */
export const select = ( reducerKey, selectorName, ...args ) => {
	return selectors[ reducerKey ][ selectorName ]( store.getState()[ reducerKey ], ...args );
};
