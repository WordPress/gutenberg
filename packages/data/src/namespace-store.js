/**
 * External dependencies
 */
import { createStore as createReduxStore } from 'redux';
import {
	flowRight,
	mapValues,
} from 'lodash';

/**
 * Creates a namespace object with a store derived from the reducer given.
 *
 * @param {Object} reducer Reducer function.
 * @param {Array} enhancers Array of enhancer functions to be added to the store.
 * @param {function} globalListener TODO: Remove this after subscribe is passed correctly.
 *
 * @return {Object} Store Object.
 */
export function createNamespace( reducer, enhancers, globalListener ) {
	const store = createReduxStore( reducer, flowRight( enhancers ) );
	const namespace = { store, reducer };

	// TODO: Move this to a subscribe function instead of referencing globalListener.
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

	return namespace;
}

/**
 * Sets selectors for given namespace.
 *
 * @param {Object} namespace  The namespace object to modify.
 * @param {Object} selectors  Selectors to register. Keys will be used as the
 *                            public facing API. Selectors will get passed the
 *                            state as first argument.
 */
export function setSelectors( namespace, selectors ) {
	const { store } = namespace;
	const createStateSelector = ( selector ) => ( ...args ) => selector( store.getState(), ...args );
	namespace.selectors = mapValues( selectors, createStateSelector );
}

/**
 * Sets actions for given namespace.
 *
 * @param {Object} namespace  The namespace object to modify.
 * @param {Object} actions    Actions to register.
 */
export function setActions( namespace, actions ) {
	const { store } = namespace;
	const createBoundAction = ( action ) => ( ...args ) => store.dispatch( action( ...args ) );
	namespace.actions = mapValues( actions, createBoundAction );
}

/**
 * Sets resolvers for a given namespace. Resolvers are side effects
 * invoked once per argument set of a given selector call, used in ensuring
 * that the data needs for the selector are satisfied.
 *
 * @param {Object} namespace   The namespace object to modify.
 * @param {Object} resolvers   Resolvers to register.
 * @param {Object} fulfillment Fulfillment implementation functions.
 */
export function setResolvers( namespace, resolvers, fulfillment ) {
	namespace.resolvers = mapValues( resolvers, ( resolver ) => {
		const { fulfill: resolverFulfill = resolver } = resolver;
		return { ...resolver, fulfill: resolverFulfill };
	} );

	const mapSelector = ( selector, selectorName ) => {
		const resolver = resolvers[ selectorName ];
		if ( ! resolver ) {
			return selector;
		}

		return ( ...args ) => {
			async function fulfillSelector() {
				const state = namespace.store.getState();
				if ( typeof resolver.isFulfilled === 'function' && resolver.isFulfilled( state, ...args ) ) {
					return;
				}

				if ( fulfillment.hasStarted( selectorName, args ) ) {
					return;
				}

				fulfillment.start( selectorName, args );
				await fulfillment.fulfill( selectorName, ...args );
				fulfillment.finish( selectorName, args );
			}

			fulfillSelector( ...args );
			return selector( ...args );
		};
	};

	namespace.selectors = mapValues( namespace.selectors, mapSelector );
}
