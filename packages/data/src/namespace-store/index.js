/**
 * External dependencies
 */
import { createStore, applyMiddleware } from 'redux';
import {
	flowRight,
	get,
	mapValues,
} from 'lodash';
import combineReducers from 'turbo-combine-reducers';

/**
 * WordPress dependencies
 */
import createReduxRoutineMiddleware from '@wordpress/redux-routine';

/**
 * Internal dependencies
 */
import promise from '../promise-middleware';
import createResolversCacheMiddleware from '../resolvers-cache-middleware';
import metadataReducer from './metadata/reducer';
import * as metadataSelectors from './metadata/selectors';
import * as metadataActions from './metadata/actions';

/**
 * Creates a namespace object with a store derived from the reducer given.
 *
 * @param {string} key              Identifying string used for namespace and redex dev tools.
 * @param {Object} options          Contains reducer, actions, selectors, and resolvers.
 * @param {Object} registry         Registry reference.
 *
 * @return {Object} Store Object.
 */
export default function createNamespace( key, options, registry ) {
	const reducer = options.reducer;
	const store = createReduxStore( key, options, registry );

	let resolvers;
	const actions = mapActions( {
		...metadataActions,
		...options.actions,
	}, store );
	let selectors = mapSelectors( {
		...mapValues( metadataSelectors, ( selector ) => ( state, ...args ) => selector( state.metadata, ...args ) ),
		...mapValues( options.selectors, ( selector ) => {
			if ( selector.isRegistrySelector ) {
				const mappedSelector = ( reg ) => ( state, ...args ) => {
					return selector( reg )( state.root, ...args );
				};
				mappedSelector.isRegistrySelector = selector.isRegistrySelector;
				return mappedSelector;
			}

			return ( state, ...args ) => selector( state.root, ...args );
		} ),
	}, store, registry );
	if ( options.resolvers ) {
		const result = mapResolvers( options.resolvers, selectors, store );
		resolvers = result.resolvers;
		selectors = result.selectors;
	}

	const getSelectors = () => selectors;
	const getActions = () => actions;

	// We have some modules monkey-patching the store object
	// It's wrong to do so but until we refactor all of our effects to controls
	// We need to keep the same "store" instance here.
	store.__unstableOriginalGetState = store.getState;
	store.getState = () => store.__unstableOriginalGetState().root;

	// Customize subscribe behavior to call listeners only on effective change,
	// not on every dispatch.
	const subscribe = store && function( listener ) {
		let lastState = store.__unstableOriginalGetState();
		store.subscribe( () => {
			const state = store.__unstableOriginalGetState();
			const hasChanged = state !== lastState;
			lastState = state;

			if ( hasChanged ) {
				listener();
			}
		} );
	};

	// This can be simplified to just { subscribe, getSelectors, getActions }
	// Once we remove the use function.
	return {
		reducer,
		store,
		actions,
		selectors,
		resolvers,
		getSelectors,
		getActions,
		subscribe,
	};
}

/**
 * Creates a redux store for a namespace.
 *
 * @param {string} key      Part of the state shape to register the
 *                          selectors for.
 * @param {Object} options  Registered store options.
 * @param {Object} registry Registry reference, for resolver enhancer support.
 *
 * @return {Object} Newly created redux store.
 */
function createReduxStore( key, options, registry ) {
	const middlewares = [
		createResolversCacheMiddleware( registry, key ),
		promise,
	];

	if ( options.controls ) {
		const normalizedControls = mapValues( options.controls, ( control ) => {
			return control.isRegistryControl ? control( registry ) : control;
		} );
		middlewares.push( createReduxRoutineMiddleware( normalizedControls ) );
	}

	const enhancers = [
		applyMiddleware( ...middlewares ),
	];
	if ( typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION__ ) {
		enhancers.push( window.__REDUX_DEVTOOLS_EXTENSION__( { name: key, instanceId: key } ) );
	}

	const { reducer, initialState } = options;
	const enhancedReducer = combineReducers( {
		metadata: metadataReducer,
		root: reducer,
	} );

	return createStore(
		enhancedReducer,
		{ root: initialState },
		flowRight( enhancers )
	);
}

/**
 * Maps selectors to a redux store.
 *
 * @param {Object} selectors  Selectors to register. Keys will be used as the
 *                            public facing API. Selectors will get passed the
 *                            state as first argument.
 * @param {Object} store      The redux store to which the selectors should be mapped.
 * @param {Object} registry   Registry reference.
 *
 * @return {Object}           Selectors mapped to the redux store provided.
 */
function mapSelectors( selectors, store, registry ) {
	const createStateSelector = ( registeredSelector ) => {
		const selector = registeredSelector.isRegistrySelector ? registeredSelector( registry.select ) : registeredSelector;

		return function runSelector() {
			// This function is an optimized implementation of:
			//
			//   selector( store.getState(), ...arguments )
			//
			// Where the above would incur an `Array#concat` in its application,
			// the logic here instead efficiently constructs an arguments array via
			// direct assignment.
			const argsLength = arguments.length;
			const args = new Array( argsLength + 1 );
			args[ 0 ] = store.__unstableOriginalGetState();
			for ( let i = 0; i < argsLength; i++ ) {
				args[ i + 1 ] = arguments[ i ];
			}

			return selector( ...args );
		};
	};

	return mapValues( selectors, createStateSelector );
}

/**
 * Maps actions to dispatch from a given store.
 *
 * @param {Object} actions    Actions to register.
 * @param {Object} store      The redux store to which the actions should be mapped.
 * @return {Object}           Actions mapped to the redux store provided.
 */
function mapActions( actions, store ) {
	const createBoundAction = ( action ) => ( ...args ) => store.dispatch( action( ...args ) );
	return mapValues( actions, createBoundAction );
}

/**
 * Returns resolvers with matched selectors for a given namespace.
 * Resolvers are side effects invoked once per argument set of a given selector call,
 * used in ensuring that the data needs for the selector are satisfied.
 *
 * @param {Object} resolvers   Resolvers to register.
 * @param {Object} selectors   The current selectors to be modified.
 * @param {Object} store       The redux store to which the resolvers should be mapped.
 * @return {Object}            An object containing updated selectors and resolvers.
 */
function mapResolvers( resolvers, selectors, store ) {
	const mappedResolvers = mapValues( resolvers, ( resolver ) => {
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
				const state = store.getState();
				if ( typeof resolver.isFulfilled === 'function' && resolver.isFulfilled( state, ...args ) ) {
					return;
				}

				const { metadata } = store.__unstableOriginalGetState();
				if ( metadataSelectors.hasStartedResolution( metadata, selectorName, args ) ) {
					return;
				}

				store.dispatch( metadataActions.startResolution( selectorName, args ) );
				await fulfillResolver( store, mappedResolvers, selectorName, ...args );
				store.dispatch( metadataActions.finishResolution( selectorName, args ) );
			}

			fulfillSelector( ...args );
			return selector( ...args );
		};
	};

	return {
		resolvers: mappedResolvers,
		selectors: mapValues( selectors, mapSelector ),
	};
}

/**
 * Calls a resolver given arguments
 *
 * @param {Object} store        Store reference, for fulfilling via resolvers
 * @param {Object} resolvers    Store Resolvers
 * @param {string} selectorName Selector name to fulfill.
 * @param {Array} args          Selector Arguments.
 */
async function fulfillResolver( store, resolvers, selectorName, ...args ) {
	const resolver = get( resolvers, [ selectorName ] );
	if ( ! resolver ) {
		return;
	}

	const action = resolver.fulfill( ...args );
	if ( action ) {
		await store.dispatch( action );
	}
}
