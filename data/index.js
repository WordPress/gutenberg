/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { createStore } from 'redux';
import { flowRight, without, mapValues, get } from 'lodash';

/**
 * Internal dependencies
 */
export { loadAndPersist, withRehydratation } from './persist';

/**
 * Module constants
 */
const stores = {};
const selectors = {};
let listeners = [];

/**
 * Global listener called for each store's update.
 */
export function globalListener() {
	listeners.forEach( listener => listener() );
}

/**
 * Subscribe to changes to any data.
 *
 * @param {Function}   listener Listener function.
 *
 * @return {Function}           Unsubscribe function.
 */
export const subscribe = ( listener ) => {
	listeners.push( listener );

	return () => {
		listeners = without( listeners, listener );
	};
};

/**
 * Registers a new sub-reducer to the global state and returns a Redux-like store object.
 *
 * @param {string} reducerKey Reducer key.
 * @param {Object} reducer    Reducer function.
 *
 * @return {Object} Store Object.
 */
export function registerReducer( reducerKey, reducer ) {
	const enhancers = [];
	if ( window.__REDUX_DEVTOOLS_EXTENSION__ ) {
		enhancers.push( window.__REDUX_DEVTOOLS_EXTENSION__( { name: reducerKey, instanceId: reducerKey } ) );
	}
	const store = createStore( reducer, flowRight( enhancers ) );
	stores[ reducerKey ] = store;
	store.subscribe( globalListener );

	return store;
}

/**
 * Registers selectors for external usage.
 *
 * @param {string} reducerKey   Part of the state shape to register the
 *                              selectors for.
 * @param {Object} newSelectors Selectors to register. Keys will be used as the
 *                              public facing API. Selectors will get passed the
 *                              state as first argument.
 */
export function registerSelectors( reducerKey, newSelectors ) {
	selectors[ reducerKey ] = newSelectors;
}

/**
 * Higher Order Component used to inject data using the registered selectors.
 *
 * @param {Function} mapSelectorsToProps Gets called with the selectors object
 *                                       to determine the data for the
 *                                       component.
 *
 * @return {Function} Renders the wrapped component and passes it data.
 */
export const query = ( mapSelectorsToProps ) => ( WrappedComponent ) => {
	const store = {
		getState() {
			return mapValues( stores, subStore => subStore.getState() );
		},
		subscribe,
		dispatch() {
			// eslint-disable-next-line no-console
			console.warn( 'Dispatch is not supported.' );
		},
	};
	const connectWithStore = ( ...args ) => {
		const ConnectedWrappedComponent = connect( ...args )( WrappedComponent );
		return ( props ) => {
			return <ConnectedWrappedComponent { ...props } store={ store } />;
		};
	};

	return connectWithStore( ( state, ownProps ) => {
		return mapSelectorsToProps( select, ownProps );
	} );
};

/**
 * Calls a selector given the current state and extra arguments.
 *
 * @param {string} reducerKey   Part of the state shape to register the
 *                              selectors for.
 * @param {string} selectorName Selector name.
 * @param {*}      args         Selectors arguments.
 *
 * @return {*} The selector's returned value.
 */
export const select = ( reducerKey, selectorName, ...args ) => {
	const selector = get( selectors, [ reducerKey, selectorName ] );
	if ( typeof selector !== 'function' ) {
		// eslint-disable-next-line no-console
		console.error( `Invalid selector called, with name "${ selectorName }" for reducer "${ reducerKey }".` +
			' Make sure the reducerName and selectorName are correct!' );
		return undefined;
	}
	return selectors[ reducerKey ][ selectorName ]( stores[ reducerKey ].getState(), ...args );
};
