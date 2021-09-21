/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuGroup } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockStyles from '../block-styles';

export default function BlockStylesMenu( { hoveredBlock, onSwitch } ) {
	const { clientId } = hoveredBlock;

	return (
		<MenuGroup
			label={ __( 'Styles' ) }
			className="block-editor-block-switcher__styles__menugroup"
		>
			<BlockStyles
				clientId={ clientId }
				onSwitch={ onSwitch }
				itemRole="menuitem"
			/>
		</MenuGroup>
	);
}
