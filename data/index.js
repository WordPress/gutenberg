/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { createStore } from 'redux';
import { flowRight, without, mapValues } from 'lodash';

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
	const store = stores[ reducerKey ];
	const createStateSelector = ( selector ) => ( ...args ) => selector( store.getState(), ...args );
	selectors[ reducerKey ] = mapValues( newSelectors, createStateSelector );
}

/**
 * Calls a selector given the current state and extra arguments.
 *
 * @param {string} reducerKey Part of the state shape to register the
 *                            selectors for.
 *
 * @return {*} The selector's returned value.
 */
export function select( reducerKey ) {
	if ( arguments.length > 1 ) {
		// eslint-disable-next-line no-console
		console.warn(
			'Deprecated: `select` now accepts only a single argument: the reducer key. ' +
			'The return value is an object of selector functions.'
		);

		const [ , selectorKey, ...args ] = arguments;
		return select( reducerKey )[ selectorKey ]( ...args );
	}

	return selectors[ reducerKey ];
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
