/**
 * External dependencies
 */
import { applyMiddleware } from 'redux';
import { get, mapValues } from 'lodash';

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

		fulfill( reducerKey ) {
			return mapValues(
				get( registry.namespaces, [ reducerKey, 'resolvers' ] ),
				( resolver ) => async ( ...args ) => (
					await registry.namespaces[ reducerKey ].store.dispatch( resolver( ...args ) )
				)
			);
		},
	};
}
