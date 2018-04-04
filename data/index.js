/**
 * External dependencies
 */
import isShallowEqual from 'shallowequal';
import { combineReducers, createStore } from 'redux';
import { flowRight, without, mapValues } from 'lodash';
import memoize from 'memize';

/**
 * WordPress dependencies
 */
import { Component, createHigherOrderComponent } from '@wordpress/element';

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
	listeners.forEach( ( listener ) => listener() );
}

/**
 * Convenience for registering reducer with actions and selectors.
 *
 * @param {string} reducerKey Reducer key.
 * @param {Object} options    Store description (reducer, actions, selectors, resolvers).
 *
 * @return {Object} Registered store object.
 */
export function registerStore( reducerKey, options ) {
	if ( ! options.reducer ) {
		throw new TypeError( 'Must specify store reducer' );
	}

	const store = registerReducer( reducerKey, options.reducer );

	if ( options.actions ) {
		registerActions( reducerKey, options.actions );
	}

	if ( options.selectors ) {
		registerSelectors( reducerKey, options.selectors );
	}

	if ( options.resolvers ) {
		registerResolvers( reducerKey, options.resolvers );
	}

	return store;
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

	// Customize subscribe behavior to call listeners only on effective change,
	// not on every dispatch.
	let lastState = store.getState();
	store.subscribe( () => {
		const state = store.getState();
		const hasChanged = state !== lastState;
		lastState = state;

		if ( hasChanged ) {
			globalListener();
		}
	} );

	return store;
}

/**
 * The combineReducers helper function turns an object whose values are different
 * reducing functions into a single reducing function you can pass to registerReducer.
 *
 * @param {Object} reducers An object whose values correspond to different reducing
 *                          functions that need to be combined into one.
 *
 * @return {Function}       A reducer that invokes every reducer inside the reducers
 *                          object, and constructs a state object with the same shape.
 */
export { combineReducers };

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
 * Registers resolvers for a given reducer key. Resolvers are side effects
 * invoked once per argument set of a given selector call, used in ensuring
 * that the data needs for the selector are satisfied.
 *
 * @param {string} reducerKey   Part of the state shape to register the
 *                              resolvers for.
 * @param {Object} newResolvers Resolvers to register.
 */
export function registerResolvers( reducerKey, newResolvers ) {
	const createResolver = ( selector, key ) => {
		// Don't modify selector behavior if no resolver exists.
		if ( ! newResolvers.hasOwnProperty( key ) ) {
			return selector;
		}

		// Ensure single invocation per argument set via memoization.
		const fulfill = memoize( async ( ...args ) => {
			const store = stores[ reducerKey ];

			// At this point, selectors have already been pre-bound to inject
			// state, it would not be otherwise provided to fulfill.
			const state = store.getState();

			let fulfillment = newResolvers[ key ]( state, ...args );

			// Attempt to normalize fulfillment as async iterable.
			fulfillment = toAsyncIterable( fulfillment );
			if ( ! isAsyncIterable( fulfillment ) ) {
				return;
			}

			for await ( const maybeAction of fulfillment ) {
				// Dispatch if it quacks like an action.
				if ( isActionLike( maybeAction ) ) {
					store.dispatch( maybeAction );
				}
			}
		} );

		return ( ...args ) => {
			fulfill( ...args );
			return selector( ...args );
		};
	};

	selectors[ reducerKey ] = mapValues( selectors[ reducerKey ], createResolver );
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
 * @param {Function} mapStateToProps Function called on every state change,
 *                                   expected to return object of props to
 *                                   merge with the component's own props.
 *
 * @return {Component} Enhanced component with merged state data props.
 */
export const withSelect = ( mapStateToProps ) => createHigherOrderComponent( ( WrappedComponent ) => {
	return class ComponentWithSelect extends Component {
		constructor() {
			super( ...arguments );

			this.runSelection = this.runSelection.bind( this );

			this.state = {};
		}

		componentWillMount() {
			this.subscribe();

			// Populate initial state.
			this.runSelection();
		}

		componentWillReceiveProps( nextProps ) {
			if ( ! isShallowEqual( nextProps, this.props ) ) {
				this.runSelection( nextProps );
			}
		}

		componentWillUnmount() {
			this.unsubscribe();

			// While above unsubscribe avoids future listener calls, callbacks
			// are snapshotted before being invoked, so if unmounting occurs
			// during a previous callback, we need to explicitly track and
			// avoid the `runSelection` that is scheduled to occur.
			this.isUnmounting = true;
		}

		subscribe() {
			this.unsubscribe = subscribe( this.runSelection );
		}

		runSelection( props = this.props ) {
			if ( this.isUnmounting ) {
				return;
			}

			const { mergeProps } = this.state;
			const nextMergeProps = mapStateToProps( select, props ) || {};

			if ( ! isShallowEqual( nextMergeProps, mergeProps ) ) {
				this.setState( {
					mergeProps: nextMergeProps,
				} );
			}
		}

		render() {
			return <WrappedComponent { ...this.props } { ...this.state.mergeProps } />;
		}
	};
}, 'withSelect' );

/**
 * Higher-order component used to add dispatch props using registered action
 * creators.
 *
 * @param {Object} mapDispatchToProps Object of prop names where value is a
 *                                    dispatch-bound action creator, or a
 *                                    function to be called with with the
 *                                    component's props and returning an
 *                                    action creator.
 *
 * @return {Component} Enhanced component with merged dispatcher props.
 */
export const withDispatch = ( mapDispatchToProps ) => createHigherOrderComponent( ( WrappedComponent ) => {
	return class ComponentWithDispatch extends Component {
		constructor() {
			super( ...arguments );

			this.proxyProps = {};
		}

		componentWillMount() {
			this.setProxyProps( this.props );
		}

		componentWillUpdate( nextProps ) {
			this.setProxyProps( nextProps );
		}

		proxyDispatch( propName, ...args ) {
			// Original dispatcher is a pre-bound (dispatching) action creator.
			mapDispatchToProps( dispatch, this.props )[ propName ]( ...args );
		}

		setProxyProps( props ) {
			// Assign as instance property so that in reconciling subsequent
			// renders, the assigned prop values are referentially equal.
			const propsToDispatchers = mapDispatchToProps( dispatch, props );
			this.proxyProps = mapValues( propsToDispatchers, ( dispatcher, propName ) => {
				// Prebind with prop name so we have reference to the original
				// dispatcher to invoke. Track between re-renders to avoid
				// creating new function references every render.
				if ( this.proxyProps.hasOwnProperty( propName ) ) {
					return this.proxyProps[ propName ];
				}

				return this.proxyDispatch.bind( this, propName );
			} );
		}

		render() {
			return <WrappedComponent { ...this.props } { ...this.proxyProps } />;
		}
	};
}, 'withDispatch' );

/**
 * Returns true if the given argument appears to be a dispatchable action.
 *
 * @param {*} action Object to test.
 *
 * @return {boolean} Whether object is action-like.
 */
export function isActionLike( action ) {
	return (
		!! action &&
		typeof action.type === 'string'
	);
}

/**
 * Returns true if the given object is an async iterable, or false otherwise.
 *
 * @param {*} object Object to test.
 *
 * @return {boolean} Whether object is an async iterable.
 */
export function isAsyncIterable( object ) {
	return (
		!! object &&
		typeof object[ Symbol.asyncIterator ] === 'function'
	);
}

/**
 * Returns true if the given object is iterable, or false otherwise.
 *
 * @param {*} object Object to test.
 *
 * @return {boolean} Whether object is iterable.
 */
export function isIterable( object ) {
	return (
		!! object &&
		typeof object[ Symbol.iterator ] === 'function'
	);
}

/**
 * Normalizes the given object argument to an async iterable, asynchronously
 * yielding on a singular or array of generator yields or promise resolution.
 *
 * @param {*} object Object to normalize.
 *
 * @return {AsyncGenerator} Async iterable actions.
 */
export function toAsyncIterable( object ) {
	if ( isAsyncIterable( object ) ) {
		return object;
	}

	return ( async function* () {
		// Normalize as iterable...
		if ( ! isIterable( object ) ) {
			object = [ object ];
		}

		for ( let maybeAction of object ) {
			// ...of Promises.
			if ( ! ( maybeAction instanceof Promise ) ) {
				maybeAction = Promise.resolve( maybeAction );
			}

			yield await maybeAction;
		}
	}() );
}
