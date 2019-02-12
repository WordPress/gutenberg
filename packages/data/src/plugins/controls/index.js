/**
 * External dependencies
 */
import { applyMiddleware } from 'redux';
import { mapValues } from 'lodash';

/**
 * WordPress dependencies
 */
import createMiddleware from '@wordpress/redux-routine';

export default function( registry ) {
	return {
		registerStore( reducerKey, options ) {
			const store = registry.registerStore( reducerKey, options );

			if ( options.controls ) {
				const normalizedControls = mapValues( options.controls, ( control ) => {
					return control.isRegistryControl ? control( registry ) : control;
				} );
				const middleware = createMiddleware( normalizedControls );
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
	};
}
