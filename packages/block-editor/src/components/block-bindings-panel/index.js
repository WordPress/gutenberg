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
import { unlock } from '../../lock-unlock';

export const BlockBindingsPanel = ( { block } ) => {
	const bindings = block?.attributes?.metadata?.bindings;

	const sources = useSelect( ( select ) =>
		unlock( select( blocksStore ) ).getAllBlockBindingsSources()
	);

	return (
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
	);
};
