/**
 * External dependencies
 */
import { useNavigation } from '@react-navigation/native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Icon, BottomSheet } from '@wordpress/components';
import { blockSettingsScreens } from '@wordpress/block-editor';
import { chevronRight } from '@wordpress/icons';

function FocalPointSettings( {} ) {
	const navigation = useNavigation();
	return (
		<BottomSheet.Cell
			customActionButton
			leftAlign
			label={ __( 'Edit focal point' ) }
			onPress={ () => {
				navigation.navigate( blockSettingsScreens.focalPoint, {} );
			} }
		>
			<Icon icon={ chevronRight } />
		</BottomSheet.Cell>
	);
}

export default FocalPointSettings;
