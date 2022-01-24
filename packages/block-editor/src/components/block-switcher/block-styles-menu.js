/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuGroup } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockStylesMenuItems from '../block-styles/menu-items';

export default function BlockStylesMenu( { hoveredBlock, onSwitch } ) {
	const { clientId } = hoveredBlock;

	return (
		<MenuGroup
			label={ __( 'Styles' ) }
			className="block-editor-block-switcher__styles__menugroup"
		>
			<BlockStylesMenuItems clientId={ clientId } onSwitch={ onSwitch } />
		</MenuGroup>
	);
}
