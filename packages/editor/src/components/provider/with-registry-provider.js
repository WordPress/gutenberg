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
import { storeConfig as blockEditorStoreConfig } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { storeConfig } from '../../store';

const withRegistryProvider = createHigherOrderComponent(
	( WrappedComponent ) =>
		withRegistry( ( props ) => {
			const {
				useSubRegistry = true,
				registry,
				...additionalProps
			} = props;
			if ( ! useSubRegistry ) {
				return <WrappedComponent { ...additionalProps } />;
			}

			const [ subRegistry, setSubRegistry ] = useState( null );
			useEffect( () => {
				const newRegistry = createRegistry(
					{
						'core/block-editor': blockEditorStoreConfig,
					},
					registry
				);
				newRegistry.registerStore( 'core/editor', storeConfig );
				setSubRegistry( newRegistry );
			}, [ registry ] );

			if ( ! subRegistry ) {
				return null;
			}

			return (
				<RegistryProvider value={ subRegistry }>
					<WrappedComponent { ...additionalProps } />
				</RegistryProvider>
			);
		} ),
	'withRegistryProvider'
);

export default withRegistryProvider;
