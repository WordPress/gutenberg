/**
 * WordPress dependencies
 */
import { createSlotFill, ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { withDispatch } from '@wordpress/data';
import { cog } from '@wordpress/icons';
/**
 * External dependencies
 */
import { useNavigation } from '@react-navigation/native';
const { Fill, Slot } = createSlotFill( 'SettingsToolbarButton' );
import { InspectorControls } from '@wordpress/block-editor';
import { View } from 'react-native';

const SettingsButton = ( {} ) => {
	const navigation = useNavigation();
	return (
		<ToolbarButton
			title={ __( 'Open Settings' ) }
			icon={ cog }
			onClick={ () => {
				navigation.navigate( 'MyModal', {
					renderBottomSheet: () => (
						<View>
							<InspectorControls.Slot />
						</View>
					),
				} );
			} }
		/>
	);
};

const SettingsButtonFill = ( props ) => (
	<Fill>
		<SettingsButton { ...props } />
	</Fill>
);

const SettingsToolbarButton = withDispatch( ( dispatch ) => {
	const { openGeneralSidebar } = dispatch( 'core/edit-post' );

	return {
		openGeneralSidebar: () => openGeneralSidebar( 'edit-post/block' ),
	};
} )( SettingsButtonFill );

SettingsToolbarButton.Slot = Slot;

export default SettingsToolbarButton;
