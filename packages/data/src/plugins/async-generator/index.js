/**
 * External dependencies
 */
import { applyMiddleware } from 'redux';
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import asyncGeneratorMiddleware, { toAsyncIterable } from './middleware';

export default function( registry ) {
	return {
		registerStore( reducerKey, options ) {
			const store = registry.registerStore( reducerKey, options );
			const enhancer = applyMiddleware( asyncGeneratorMiddleware );
			const createStore = () => store;
			Object.assign(
				store,
				enhancer( createStore )( options.reducer )
			);
			return store;
		},

		async __experimentalFulfill( reducerKey, selectorName, ...args ) {
			const resolver = get( registry.namespaces, [ reducerKey, 'resolvers', selectorName ] );
			if ( ! resolver ) {
				return;
			}
			const store = registry.namespaces[ reducerKey ].store;
			const state = store.getState();
			const actionCreator = resolver.fulfill( state, ...args );
			if ( actionCreator ) {
				await store.dispatch( toAsyncIterable( actionCreator ) );
			}
		},
	};
}
