/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { useRegistry, createRegistry, RegistryProvider } from '@wordpress/data';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { storeConfig } from '../../store';
import { STORE_NAME as blockEditorStoreName } from '../../store/constants';

function getSubRegistry( subRegistries, registry, useSubRegistry ) {
	if ( ! useSubRegistry ) {
		return registry;
	}
	let subRegistry = subRegistries.get( registry );
	if ( ! subRegistry ) {
		subRegistry = createRegistry( {}, registry );
		subRegistry.registerStore( blockEditorStoreName, storeConfig );
		subRegistries.set( registry, subRegistry );
	}
	return subRegistry;
}

const withRegistryProvider = createHigherOrderComponent(
	( WrappedComponent ) =>
		( { useSubRegistry = true, ...props } ) => {
			const registry = useRegistry();
			const [ subRegistries ] = useState( () => new WeakMap() );
			const subRegistry = getSubRegistry(
				subRegistries,
				registry,
				useSubRegistry
			);

			if ( subRegistry === registry ) {
				return <WrappedComponent registry={ registry } { ...props } />;
			}

			return (
				<RegistryProvider value={ subRegistry }>
					<WrappedComponent registry={ subRegistry } { ...props } />
				</RegistryProvider>
			);
		},
	'withRegistryProvider'
);

export default withRegistryProvider;
