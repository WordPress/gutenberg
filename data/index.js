/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { createStore } from 'redux';
import { flowRight, without, mapValues } from 'lodash';

/**
 * WordPress dependencies
 */
import { deprecated } from '@wordpress/utils';

/**
 * Internal dependencies
 */
export { loadAndPersist, withRehydratation } from './persist';

/**
 * Module constants
 */
const stores = {};
const selectors = {};
const actions = {};
let listeners = [];

/**
 * Global listener called for each store's update.
 */
export function globalListener() {
	listeners.forEach( listener => listener() );
}

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
 * Registers actions for external usage.
 *
 * @param {string} reducerKey   Part of the state shape to register the
 *                              selectors for.
 * @param {Object} newActions   Actions to register.
 */
export function registerActions( reducerKey, newActions ) {
	const store = stores[ reducerKey ];
	const createBoundAction = ( action ) => ( ...args ) => store.dispatch( action( ...args ) );
	actions[ reducerKey ] = mapValues( newActions, createBoundAction );
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
 * Calls a selector given the current state and extra arguments.
 *
 * @param {string} reducerKey Part of the state shape to register the
 *                            selectors for.
 *
 * @return {*} The selector's returned value.
 */
export function select( reducerKey ) {
	if ( arguments.length > 1 ) {
		deprecated( 'Calling select with multiple arguments', {
			version: '2.4',
			plugin: 'Gutenberg',
		} );

		const [ , selectorKey, ...args ] = arguments;
		return select( reducerKey )[ selectorKey ]( ...args );
	}

	return selectors[ reducerKey ];
}

/**
 * Returns the available actions for a part of the state.
 *
 * @param {string} reducerKey Part of the state shape to dispatch the
 *                            action for.
 *
 * @return {*} The action's returned value.
 */
export function dispatch( reducerKey ) {
	return actions[ reducerKey ];
}

/**
 * Higher Order Component used to inject data using the registered selectors.
 *
 * @param {Function} mapSelectorsToProps Gets called with the selectors object
 *                                       to determine the data for the
 *                                       component.
 * @param {Function} mapDispatchToProps  Gets called with the wp.data.dispatch function
 *                                       to create action handlers.
 *
 *
 * @return {Function} Renders the wrapped component and passes it data.
 */
export const query = ( mapSelectorsToProps, mapDispatchToProps ) => ( WrappedComponent ) => {
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

	return connectWithStore(
		mapSelectorsToProps ?
			( state, ownProps ) => {
				return mapSelectorsToProps( select, ownProps );
			} : undefined,
		mapDispatchToProps ?
			( unusedDispatch, ownProps ) => {
				return mapDispatchToProps( dispatch, ownProps );
			} : undefined
	);
};
