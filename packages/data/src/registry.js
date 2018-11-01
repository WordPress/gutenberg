/**
 * External dependencies
 */
import {
	without,
	mapValues,
} from 'lodash';

/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import createNamespace from './namespace-store.js';
import dataStore from './store';

/**
 * An isolated orchestrator of store registrations.
 *
 * @typedef {WPDataRegistry}
 *
 * @property {Function} registerGenericStore
 * @property {Function} registerStore
 * @property {Function} subscribe
 * @property {Function} select
 * @property {Function} dispatch
 */

/**
 * An object of registry function overrides.
 *
 * @typedef {WPDataPlugin}
 */

/**
 * Creates a new store registry, given an optional object of initial store
 * configurations.
 *
 * @param {Object} storeConfigs Initial store configurations.
 *
 * @return {WPDataRegistry} Data registry.
 */
export function createRegistry( storeConfigs = {} ) {
	const stores = {};
	let listeners = [];

	/**
	 * Global listener called for each store's update.
	 */
	function globalListener() {
		listeners.forEach( ( listener ) => listener() );
	}

	/**
	 * Subscribe to changes to any data.
	 *
	 * @param {Function}   listener Listener function.
	 *
	 * @return {Function}           Unsubscribe function.
	 */
	const subscribe = ( listener ) => {
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
	function select( reducerKey ) {
		const store = stores[ reducerKey ];
		return store && store.getSelectors();
	}

	/**
	 * Returns the available actions for a part of the state.
	 *
	 * @param {string} reducerKey Part of the state shape to dispatch the
	 *                            action for.
	 *
	 * @return {*} The action's returned value.
	 */
	function dispatch( reducerKey ) {
		const store = stores[ reducerKey ];
		return store && store.getActions();
	}

	//
	// Deprecated
	// TODO: Remove this after `use()` is removed.
	//
	function withPlugins( attributes ) {
		return mapValues( attributes, ( attribute, key ) => {
			if ( typeof attribute !== 'function' ) {
				return attribute;
			}
			return function() {
				return registry[ key ].apply( null, arguments );
			};
		} );
	}

	/**
	 * Registers a generic store.
	 *
	 * @param {string} key    Store registry key.
	 * @param {Object} config Configuration (getSelectors, getActions, subscribe).
	 */
	function registerGenericStore( key, config ) {
		if ( typeof config.getSelectors !== 'function' ) {
			throw new TypeError( 'config.getSelectors must be a function' );
		}
		if ( typeof config.getActions !== 'function' ) {
			throw new TypeError( 'config.getActions must be a function' );
		}
		if ( typeof config.subscribe !== 'function' ) {
			throw new TypeError( 'config.subscribe must be a function' );
		}
		stores[ key ] = config;
		config.subscribe( globalListener );
	}

	let registry = {
		registerGenericStore,
		stores,
		namespaces: stores, // TODO: Deprecate/remove this.
		subscribe,
		select,
		dispatch,
		use,
	};

	//
	// Deprecated
	//
	registry.registerReducer = ( reducerKey, reducer ) => {
		deprecated( 'registry.registerReducer', {
			alternative: 'registry.registerStore',
			plugin: 'Gutenberg',
			version: '3.1.0',
		} );

		const namespace = createNamespace( reducerKey, { reducer }, registry );
		registerGenericStore( reducerKey, namespace );
		return namespace.store;
	};

	//
	// Deprecated
	//
	registry.registerActions = ( reducerKey, actions ) => {
		deprecated( 'registry.registerActions', {
			alternative: 'registry.registerStore',
			plugin: 'Gutenberg',
			version: '3.1.0',
		} );

		const namespace = createNamespace( reducerKey, { actions }, registry );
		registerGenericStore( reducerKey, namespace );
	};

	//
	// Deprecated
	//
	registry.registerSelectors = ( reducerKey, selectors ) => {
		deprecated( 'registry.registerSelectors', {
			alternative: 'registry.registerStore',
			plugin: 'Gutenberg',
			version: '3.1.0',
		} );

		const namespace = createNamespace( reducerKey, { selectors }, registry );
		registerGenericStore( reducerKey, namespace );
	};

	//
	// Deprecated
	//
	registry.registerResolvers = ( reducerKey, resolvers ) => {
		deprecated( 'registry.registerResolvers', {
			alternative: 'registry.registerStore',
			plugin: 'Gutenberg',
			version: '3.1.0',
		} );

		const namespace = createNamespace( reducerKey, { resolvers }, registry );
		registerGenericStore( reducerKey, namespace );
	};

	/**
	 * Registers a standard `@wordpress/data` store.
	 *
	 * @param {string} reducerKey Reducer key.
	 * @param {Object} options    Store description (reducer, actions, selectors, resolvers).
	 *
	 * @return {Object} Registered store object.
	 */
	registry.registerStore = ( reducerKey, options ) => {
		if ( ! options.reducer ) {
			throw new TypeError( 'Must specify store reducer' );
		}

		const namespace = createNamespace( reducerKey, options, registry );
		registerGenericStore( reducerKey, namespace );
		return namespace.store;
	};

	//
	// Deprecated
	//
	function use( plugin, options ) {
		deprecated( 'registry.use', {
			alternative: 'registry.registerGenericStore',
			plugin: 'Gutenberg',
			version: '3.1.0',
		} );

		registry = {
			...registry,
			...plugin( registry, options ),
		};

		return registry;
	}

	Object.entries( {
		'core/data': dataStore,
		...storeConfigs,
	} ).map( ( [ name, config ] ) => registry.registerStore( name, config ) );

	return withPlugins( registry );
}
