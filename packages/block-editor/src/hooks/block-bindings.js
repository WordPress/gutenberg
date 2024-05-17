/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { store as blocksStore } from '@wordpress/blocks';
import {
	PanelBody,
	__experimentalHStack as HStack,
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';
import InspectorControls from '../components/inspector-controls';

export const BlockBindingsPanel = ( { metadata } ) => {
	const { bindings } = metadata || {};
	const { sources } = useSelect( ( select ) => {
		const _sources = unlock(
			select( blocksStore )
		).getAllBlockBindingsSources();

		return {
			sources: _sources,
		};
	}, [] );

	if ( ! bindings ) {
		return null;
	}

	return (
		<InspectorControls>
			<PanelBody
				title={ __( 'Bindings' ) }
				className="components-panel__block-bindings-panel"
			>
				<ItemGroup isBordered isSeparated size="large">
					{ Object.keys( bindings ).map( ( key ) => {
						return (
							<Item key={ key }>
								<HStack>
									<span>{ key }</span>
									<span className="components-item__block-bindings-source">
										{ sources[ bindings[ key ].source ]
											? sources[ bindings[ key ].source ]
													.label
											: bindings[ key ].source }
									</span>
								</HStack>
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
