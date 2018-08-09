/**
 * External dependencies
 */
import { FreshDataApi } from '@fresh-data/framework';

/**
 * Internal dependencies
 */
import * as actions from './actions';
import reducer from './reducer';

export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;

/**
 * Fresh data API.
 *
 * @property {Methods}    methods      Functions that correspond to API verbs like
 *                                     "GET" or "POST" and used by operations.
 * @property {Operations} operations   Functions to handle operations on the
 *                                     api, such as "read", or "update".
 * @property {Selectors}  selectors    Selector functions which can require
 *                                     resources and return their current values.
 * @property {Mutations}  mutations    Mutation functions that map to operations and
 *                                     designed to be used by the application.
 *
 * @typedef {WPFreshDataApiSpec}
 */

/**
 * Fresh data store options.
 *
 * @property {WPFreshDataAPI} apiSpec A fresh-data API Specification.
 *
 * @typedef {WPFreshDataStoreOptions}
 */

/**
 * Creates a fresh-data api client for use in @wordpress/data.
 *
 * @param {Object} apiSpec The api specification for the client.
 * @param {Object} dispatchActions `dataRequested` and `dataReceived` action creators
 *                                      wrapped in a dispatch function.
 *
 * @return {Object} An ApiClient ready to be used.
 */
export function createApiClient( apiSpec, dispatchActions ) {
	if ( ! apiSpec.methods ) {
		throw new TypeError( 'apiSpec must specify methods' );
	}
	if ( ! apiSpec.operations ) {
		throw new TypeError( 'apiSpec must specify operations' );
	}

	// TODO: Remove ApiClass after fresh-data 0.3.0 is released.
	class ApiClass extends FreshDataApi {
		constructor() {
			super();
			this.methods = apiSpec.methods;
			this.operations = apiSpec.operations;
			this.mutations = apiSpec.mutations;
			this.selectors = apiSpec.selectors || {};
		}
	}

	const api = new ApiClass();
	api.setDataHandlers( dispatchActions );
	return api.createClient( 'client' );
}

/**
 * Registers a fresh-data api.
 *
 * @param {WPDataRegistry}           registry    Data registry.
 * @param {string}                   reducerKey  Name of reducerKey and api instance.
 * @param {WPFreshDataStoreOptions}  options     Options given to registerStore.
 *
 * @return {Object} The api client created.
 */
export function registerApiClient( registry, reducerKey, options ) {
	const { apiSpec } = options;

	const store = registry.registerReducer( reducerKey, reducer, options.persist );
	registry.registerActions( reducerKey, actions );

	const dispatchActions = registry.dispatch( reducerKey );
	const apiClient = createApiClient( apiSpec, dispatchActions );

	// Subscribe to the store directly so we don't get all the global events
	store.subscribe( () => {
		const state = store.getState() || {};
		const clientState = state.client || {}; // TODO: Remove this after fresh-data 0.3.0
		apiClient.setState( clientState );
	} );

	return { store, apiClient };
}

/**
 * Data plugin to map api data to component requirements.
 *
 * @param {WPDataRegistry} registry Data registry.
 *
 * @return {WPDataPlugin} Data plugin.
 */
export default function( registry ) {
	const apisByReducerKey = {};

	return {
		registerStore( reducerKey, options ) {
			if ( options.apiSpec ) {
				const { store, apiClient } = registerApiClient( registry, reducerKey, options );
				apisByReducerKey[ reducerKey ] = apiClient;
				return store;
			}
			return registry.registerStore( reducerKey, options );
		},
		getApiClient( reducerKey ) {
			return apisByReducerKey[ reducerKey ] || null;
		},
	};
}
