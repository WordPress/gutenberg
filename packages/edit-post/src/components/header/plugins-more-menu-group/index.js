/**
 * WordPress dependencies
 */
import {
	createSlotFill,
	MenuGroup,
	__experimentalUseSlot as useSlot,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const { Fill: PluginsMoreMenuGroup, Slot } = createSlotFill(
	'PluginsMoreMenuGroup'
);

function PluginsMoreMenuGroupSlot( { fillProps } ) {
	const slot = useSlot( 'PluginsMoreMenuGroup' );
	const hasFills = Boolean( slot.fills && slot.fills.length );

	if ( ! hasFills ) {
		return null;
	}

	return (
		<MenuGroup label={ __( 'Plugins' ) }>
			<Slot fillProps={ fillProps } bubblesVirtually />
		</MenuGroup>
	);
}

PluginsMoreMenuGroup.Slot = PluginsMoreMenuGroupSlot;

export default PluginsMoreMenuGroup;
