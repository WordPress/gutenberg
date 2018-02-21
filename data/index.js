/**
 * External dependencies
 */
import isEqualShallow from 'is-equal-shallow';
import { createStore } from 'redux';
import { flowRight, without, mapValues, isPlainObject } from 'lodash';

/**
 * WordPress dependencies
 */
import { deprecated } from '@wordpress/utils';
import { Component, getWrapperDisplayName } from '@wordpress/element';

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
 * Higher-order component used to inject state-derived props using registered
 * selectors.
 *
 * @param {Object|Function} mapStateToProps Object of prop names where value is
 *                                          a state selector to populate every
 *                                          state change. Passed as function,
 *                                          it is called with the component's
 *                                          own original props.
 *
 * @return {Component} Enhanced component with merged state data props.
 */
export const withData = ( mapStateToProps ) => ( WrappedComponent ) => {
	// Normalize object form to function.
	if ( isPlainObject( mapStateToProps ) ) {
		// Object form is pairs of prop names to selectors.
		const propsToSelectors = mapStateToProps;
		mapStateToProps = () => mapValues( propsToSelectors, ( selector ) => selector() );
	}

	class ComponentWithData extends Component {
		constructor() {
			super( ...arguments );

			this.state = {};
		}

		componentWillMount() {
			this.subscribe();

			// Populate initial state.
			this.runSelection( this.props );
		}

		componentWillUnmount() {
			this.unsubscribe();
		}

		subscribe() {
			this.unsubscribe = subscribe( () => this.runSelection( this.props ) );
		}

		runSelection( props ) {
			const newState = mapStateToProps( props );
			if ( ! isEqualShallow( newState, this.state ) ) {
				this.setState( newState );
			}
		}

		render() {
			return <WrappedComponent { ...this.props } { ...this.state } />;
		}
	}

	ComponentWithData.displayName = getWrapperDisplayName( ComponentWithData, 'data' );

	return ComponentWithData;
};

/**
 * Higher-order component used to add dispatch props using registered action
 * creators.
 *
 * @param {Object} propsToDispatchers Object of prop names where value is a
 *                                    dispatch-bound action creator, or a
 *                                    function to be called with with the
 *                                    component's props and returning an
 *                                    action creator.
 *
 * @return {Component} Enhanced component with merged dispatcher props.
 */
export const withDispatch = ( propsToDispatchers ) => ( WrappedComponent ) => {
	class ComponentWithDispatch extends Component {
		constructor() {
			super( ...arguments );

			// Assign as instance property so that in reconciling subsequent
			// renders, the assigned prop values are referentially equal.
			this.proxyProps = mapValues( propsToDispatchers, ( dispatcher, propName ) => {
				// Prebind with prop name so we have reference to the original
				// dispatcher to invoke.
				return this.proxyDispatch.bind( this, propName );
			} );
		}

		proxyDispatch( propName, ...args ) {
			// Original dispatcher is a pre-bound (dispatching) action creator.
			const result = propsToDispatchers[ propName ]( ...args );

			// ...or, in more complex cases, it can leverage component props to
			// generate dispatch arguments. We assume that if the result is not
			// an object (return value of dispatch), not yet dispatched.
			if ( typeof result === 'function' ) {
				result( this.props );
			}
		}

		render() {
			return <WrappedComponent { ...this.props } { ...this.proxyProps } />;
		}
	}

	ComponentWithDispatch.displayName = getWrapperDisplayName( ComponentWithDispatch, 'dispatch' );

	return ComponentWithDispatch;
};

export const query = ( mapSelectToProps ) => {
	deprecated( 'wp.data.query', {
		version: '2.5',
		alternative: 'wp.data.withData',
		plugin: 'Gutenberg',
	} );

	return withData( ( props ) => {
		return mapSelectToProps( select, props );
	} );
};
