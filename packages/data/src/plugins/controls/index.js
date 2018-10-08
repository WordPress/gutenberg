/**
 * External dependencies
 */
import { applyMiddleware } from 'redux';
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import createMiddleware from '@wordpress/redux-routine';

export default function( registry ) {
	return {
		registerStore( reducerKey, options ) {
			const store = registry.registerStore( reducerKey, options );

			if ( options.controls ) {
				const middleware = createMiddleware( options.controls );
				const enhancer = applyMiddleware( middleware );
				const createStore = () => store;

				Object.assign(
					store,
					enhancer( createStore )( options.reducer )
				);

				registry.namespaces[ reducerKey ].supportControls = true;
			}

			return store;
		},

		async __experimentalFulfill( reducerKey, selectorName, ...args ) {
			if ( ! registry.namespaces[ reducerKey ].supportControls ) {
				await registry.__experimentalFulfill( reducerKey, selectorName, ...args );
				return;
			}

			const resolver = get( registry.namespaces, [ reducerKey, 'resolvers', selectorName ] );
			if ( ! resolver ) {
				return;
			}
			await registry.namespaces[ reducerKey ].store.dispatch( resolver.fulfill( ...args ) );
		},
	};
}
