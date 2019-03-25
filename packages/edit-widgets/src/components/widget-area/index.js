/**
 * WordPress dependencies
 */
import { Panel, PanelBody } from '@wordpress/components';
import {
	BlockEditorProvider,
	BlockList,
	storeConfig,
} from '@wordpress/block-editor';
import { useState, useEffect } from '@wordpress/element';
import {
	RegistryProvider,
	withRegistry,
	createRegistry,
	plugins,
} from '@wordpress/data';

function WidgetArea( { title, initialOpen, registry } ) {
	// Disable reason, this rule conflicts with the React hooks rule (no conditionals)
	// eslint-disable-next-line @wordpress/no-unused-vars-before-return
	const [ blocks, updateBlocks ] = useState( [] );
	const [ subRegistry, updateRegistry ] = useState( null );
	useEffect( () => {
		// TODO: This behavior should be embedded in the BlockEditorProvider
		const newRegistry = createRegistry( {}, registry );
		newRegistry.use( plugins.controls );
		newRegistry.registerStore( 'core/block-editor', storeConfig );
		updateRegistry( newRegistry );
	}, [ registry ] );

	if ( ! subRegistry ) {
		return null;
	}

	return (
		<Panel>
			<PanelBody
				title={ title }
				initialOpen={ initialOpen }
			>
				<RegistryProvider value={ subRegistry }>
					<BlockEditorProvider
						value={ blocks }
						onInput={ updateBlocks }
						onChange={ updateBlocks }
					>
						<BlockList />
					</BlockEditorProvider>
				</RegistryProvider>
			</PanelBody>
		</Panel>
	);
}

export default withRegistry( WidgetArea );
