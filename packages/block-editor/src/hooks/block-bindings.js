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
import { unlock } from '../lock-unlock';
import InspectorControls from '../components/inspector-controls';
import {
	blockBindingsKey,
	useBlockEditContext,
} from '../components/block-edit/context';

export const BlockBindingsPanel = () => {
	const blockEditContext = useBlockEditContext();
	const bindings = blockEditContext[ blockBindingsKey ];

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
