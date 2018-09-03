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
			}

			return store;
		},

		async fulfill( reducerKey, selectorName, ...args ) {
			const resolver = get( registry.namespaces, [ reducerKey, 'resolvers', selectorName ] );
			if ( ! resolver ) {
				return;
			}
			await registry.namespaces[ reducerKey ].store.dispatch( resolver( ...args ) );
		},
	};
}
