/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuGroup } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import {
	cloneBlock,
	getBlockFromExample,
	store as blocksStore,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import BlockStyles from '../block-styles';
import PreviewBlockPopover from './preview-block-popover';

export default function BlockStylesMenu( { hoveredBlock, onSwitch } ) {
	const { name, clientId } = hoveredBlock;
	const [ hoveredClassName, setHoveredClassName ] = useState();
	const blockType = useSelect(
		( select ) => select( blocksStore ).getBlockType( name ),
		[ name ]
	);

	return (
		<MenuGroup
			label={ __( 'Styles' ) }
			className="block-editor-block-switcher__styles__menugroup"
		>
			{ hoveredClassName && (
				<PreviewBlockPopover
					blocks={
						blockType.example
							? getBlockFromExample( blockType.name, {
									attributes: {
										...blockType.example.attributes,
										className: hoveredClassName,
									},
									innerBlocks: blockType.example.innerBlocks,
							  } )
							: cloneBlock( hoveredBlock, {
									className: hoveredClassName,
							  } )
					}
				/>
			) }
			<BlockStyles
				clientId={ clientId }
				onSwitch={ onSwitch }
				onHoverClassName={ setHoveredClassName }
				itemRole="menuitem"
			/>
		</MenuGroup>
	);
}
