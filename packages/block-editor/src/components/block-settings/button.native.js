/**
 * WordPress dependencies
 */
import { createSlotFill, ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { withDispatch } from '@wordpress/data';
import { cog } from '@wordpress/icons';
import { store as editPostStore } from '@wordpress/edit-post';

const { Fill, Slot } = createSlotFill( 'SettingsToolbarButton' );

const SettingsButton = ( { openGeneralSidebar } ) => (
	<ToolbarButton
		title={ __( 'Open Settings' ) }
		icon={ cog }
		onClick={ openGeneralSidebar }
	/>
);

const SettingsButtonFill = ( props ) => (
	<Fill>
		<SettingsButton { ...props } />
	</Fill>
);

const SettingsToolbarButton = withDispatch( ( dispatch ) => {
	const { openGeneralSidebar } = dispatch( editPostStore );

	return {
		openGeneralSidebar: () => openGeneralSidebar( 'edit-post/block' ),
	};
} )( SettingsButtonFill );

SettingsToolbarButton.Slot = Slot;

export default SettingsToolbarButton;
