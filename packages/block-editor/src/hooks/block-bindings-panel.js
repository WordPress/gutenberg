/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { store as blocksStore } from '@wordpress/blocks';
import {
	PanelBody,
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';
import { unlock } from '../lock-unlock';
import InspectorControls from '../components/inspector-controls';

export const BlockBindingsPanel = () => {
	const { block } = useSelect( ( select ) => {
		const { getSelectedBlockClientId, getBlock } = unlock(
			select( blockEditorStore )
		);

		const _selectedBlockClientId = getSelectedBlockClientId();

		return {
			selectedBlockClientId: _selectedBlockClientId,
			block: getBlock( _selectedBlockClientId ),
		};
	}, [] );

	const bindings = block?.attributes?.metadata?.bindings;

	const sources = useSelect( ( select ) =>
		unlock( select( blocksStore ) ).getAllBlockBindingsSources()
	);

	const hasBindings = block?.attributes?.metadata?.bindings
		? Object.keys( block.attributes.metadata.bindings ).length > 0
		: false;

	if ( ! hasBindings ) {
		return null;
	}

	return (
		<InspectorControls>
			<PanelBody
				title={ __( 'Bindings' ) }
				className="components-panel__block-bindings-panel"
			>
				<ItemGroup isBordered isSeparated size="large">
					{ Object.keys( bindings ).map( ( key, index ) => {
						return (
							<Item key={ index }>
								<span>{ key }</span>
								<span className="components-item__block-bindings-source">
									{ sources[ bindings[ key ].source ].label }
								</span>
							</Item>
						);
					} ) }
				</ItemGroup>
			</PanelBody>
		</InspectorControls>
	);
};

export default {
	edit: BlockBindingsPanel,
	attributeKeys: [ 'metadata' ],
	hasSupport() {
		return true;
	},
};
