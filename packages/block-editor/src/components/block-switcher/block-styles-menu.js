/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuGroup } from '@wordpress/components';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockStyles from '../block-styles';
import PreviewBlockPopover from './preview-block-popover';

const BlockStylesMenu = ( { hoveredBlock, onSwitch } ) => {
	const [ hoveredClassName, setHoveredClassName ] = useState();
	return (
		<MenuGroup
			label={ __( 'Styles' ) }
			className="block-editor-block-switcher__styles__menugroup"
		>
			{ hoveredClassName && (
				<PreviewBlockPopover
					hoveredBlock={ hoveredBlock }
					hoveredClassName={ hoveredClassName }
				/>
			) }
			<BlockStyles
				clientId={ hoveredBlock.clientId }
				onSwitch={ onSwitch }
				onHoverClassName={ setHoveredClassName }
				itemRole="menuitem"
			/>
		</MenuGroup>
	);
};
export default BlockStylesMenu;
