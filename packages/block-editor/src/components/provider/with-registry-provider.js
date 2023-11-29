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
import { STORE_NAME as blockEditorStoreName } from '../../store/constants';

const withRegistryProvider = createHigherOrderComponent(
	( WrappedComponent ) => {
		return withRegistry(
			( {
				useSubRegistry = true,
				forceRegistry,
				registry,
				...props
			} ) => {
				const [ subRegistry, setSubRegistry ] = useState( null );
				useEffect( () => {
					if ( forceRegistry || ! useSubRegistry ) {
						return;
					}
					const newRegistry = createRegistry( {}, registry );
					newRegistry.registerStore(
						blockEditorStoreName,
						storeConfig
					);
					setSubRegistry( newRegistry );
				}, [ registry, useSubRegistry, forceRegistry ] );

				if ( forceRegistry ) {
					return (
						<RegistryProvider value={ forceRegistry }>
							<WrappedComponent
								registry={ forceRegistry }
								{ ...props }
							/>
						</RegistryProvider>
					);
				}

				if ( ! useSubRegistry ) {
					return (
						<WrappedComponent registry={ registry } { ...props } />
					);
				}

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
