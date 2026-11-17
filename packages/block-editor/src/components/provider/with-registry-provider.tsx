import { useState } from '@wordpress/element';
import { useRegistry, createRegistry, RegistryProvider } from '@wordpress/data';
import { createHigherOrderComponent } from '@wordpress/compose';
import type { DataRegistry } from '@wordpress/data';
import type { ComponentType } from 'react';
import { storeConfig } from '../../store';
import { STORE_NAME as blockEditorStoreName } from '../../store/constants';
import type { BlockEditorProviderProps, RegistryProvidedProps } from './types';

function getSubRegistry(
	subRegistries: WeakMap< DataRegistry, DataRegistry >,
	registry: DataRegistry,
	useSubRegistry: boolean
) {
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
	( WrappedComponent: ComponentType< RegistryProvidedProps > ) =>
		function WithRegistryProvider( {
			useSubRegistry = true,
			...props
		}: BlockEditorProviderProps ) {
			const registry = useRegistry();
			const [ subRegistries ] = useState(
				() => new WeakMap< DataRegistry, DataRegistry >()
			);
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
