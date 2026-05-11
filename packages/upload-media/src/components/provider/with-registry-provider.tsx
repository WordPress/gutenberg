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
import { STORE_NAME as mediaUploadStoreName } from '../../store/constants';

type WPDataRegistry = ReturnType< typeof createRegistry >;

function getSubRegistry(
	subRegistries: WeakMap< WPDataRegistry, WPDataRegistry >,
	registry: WPDataRegistry,
	useSubRegistry: boolean
) {
	if ( ! useSubRegistry ) {
		return registry;
	}
	let subRegistry = subRegistries.get( registry );
	if ( ! subRegistry ) {
		subRegistry = createRegistry( {}, registry );
		subRegistry.registerStore( mediaUploadStoreName, storeConfig );
		subRegistries.set( registry, subRegistry );
	}
	return subRegistry;
}

const withRegistryProvider = createHigherOrderComponent(
	( WrappedComponent ) =>
		( { useSubRegistry = true, ...props } ) => {
			const registry = useRegistry() as unknown as WPDataRegistry;
			const [ subRegistries ] = useState<
				WeakMap< WPDataRegistry, WPDataRegistry >
			>( () => new WeakMap() );
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
