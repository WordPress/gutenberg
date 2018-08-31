/**
 * External dependencies
 */
import { applyMiddleware } from 'redux';

/**
 * WordPress dependencies
 */
import { createMiddleware, createRuntime } from '@wordpress/redux-routine';

export default function( registry ) {
	return {
		registerStore( reducerKey, options ) {
			const store = registry.registerStore( reducerKey, options );

			if ( options.controls ) {
				const runtime = createRuntime( options.controls );
				const middleware = createMiddleware( runtime );
				const enhancer = applyMiddleware( middleware );
				const createStore = () => store;

				Object.assign(
					store,
					enhancer( createStore )( options.reducer )
				);
			}

			return store;
		},
	};
}
