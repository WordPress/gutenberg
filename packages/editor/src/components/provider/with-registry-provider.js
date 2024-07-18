/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { useRegistry, createRegistry, RegistryProvider } from '@wordpress/data';
import { createHigherOrderComponent } from '@wordpress/compose';
import { storeConfig as blockEditorStoreConfig } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { storeConfig } from '../../store';

function getSubRegistry( subRegistries, registry, useSubRegistry ) {
	if ( ! useSubRegistry ) {
		return registry;
	}
	let subRegistry = subRegistries.get( registry );
	if ( ! subRegistry ) {
		subRegistry = createRegistry(
			{
				'core/block-editor': blockEditorStoreConfig,
			},
			registry
		);
		// Todo: The interface store should also be created per instance.
		subRegistry.registerStore( 'core/editor', storeConfig );
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
