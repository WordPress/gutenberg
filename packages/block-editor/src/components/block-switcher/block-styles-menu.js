/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuGroup } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import BlockStylesMenuItems from '../block-styles/menu-items';

export default function BlockStylesMenu( { hoveredBlockClientId, onSwitch } ) {
	const { hasBlockStyles } = useSelect(
		( select ) => {
			const { getBlockStyles } = select( blocksStore );
			const { getBlockName } = select( blockEditorStore );
			const styles = getBlockStyles(
				getBlockName( hoveredBlockClientId )
			);
			return {
				hasBlockStyles: !! styles?.length,
			};
		},
		[ hoveredBlockClientId ]
	);

	if ( ! hasBlockStyles ) {
		return null;
	}

	return (
		<MenuGroup
			label={ __( 'Styles' ) }
			className="block-editor-block-switcher__styles__menugroup"
		>
			<BlockStylesMenuItems
				clientId={ hoveredBlockClientId }
				onSwitch={ onSwitch }
			/>
		</MenuGroup>
	);
}
