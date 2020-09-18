/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import {
	withRegistry,
	createRegistry,
	RegistryProvider,
} from '@wordpress/data';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { storeConfig } from '../../store';
import applyMiddlewares from '../../store/middlewares';

const withRegistryProvider = createHigherOrderComponent(
	( WrappedComponent ) => {
		return withRegistry(
			( { useSubRegistry = true, registry, ...props } ) => {
				if ( ! useSubRegistry ) {
					return (
						<WrappedComponent registry={ registry } { ...props } />
					);
				}

				const [ subRegistry, setSubRegistry ] = useState( null );
				useEffect( () => {
					const newRegistry = createRegistry( {}, registry );
					const store = newRegistry.registerStore(
						'core/block-editor',
						storeConfig
					);
					// This should be removed after the refactoring of the effects to controls.
					applyMiddlewares( store );
					setSubRegistry( newRegistry );
				}, [ registry ] );

				if ( ! subRegistry ) {
					return null;
				}

				return (
					<RegistryProvider value={ subRegistry }>
						<WrappedComponent
							registry={ subRegistry }
							{ ...props }
						/>
					</RegistryProvider>
				);
			}
		);
	},
	'withRegistryProvider'
);

export default withRegistryProvider;
