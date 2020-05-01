/**
 * WordPress dependencies
 */
import {
	createSlotFill,
	MenuGroup,
	__experimentalUseSlot as useSlot,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const { Fill: ToolsMoreMenuGroup, Slot } = createSlotFill(
	'ToolsMoreMenuGroup'
);

function ToolsMoreMenuGroupSlot( { fillProps } ) {
	const slot = useSlot( 'ToolsMoreMenuGroup' );
	const hasFills = Boolean( slot.fills && slot.fills.length );

	if ( ! hasFills ) {
		return null;
	}

	return (
		<MenuGroup label={ __( 'Tools' ) }>
			<Slot fillProps={ fillProps } bubblesVirtually />
		</MenuGroup>
	);
}

ToolsMoreMenuGroup.Slot = ToolsMoreMenuGroupSlot;

export default ToolsMoreMenuGroup;
