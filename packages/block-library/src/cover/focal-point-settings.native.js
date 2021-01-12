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

function FocalPointSettings( {
	focalPoint,
	mediaType,
	onFocalPointChange,
	url,
} ) {
	const navigation = useNavigation();
	return (
		<BottomSheet.Cell
			customActionButton
			leftAlign
			label={ __( 'Edit focal point' ) }
			onPress={ () => {
				navigation.navigate( blockSettingsScreens.focalPoint, {
					focalPoint,
					mediaType,
					onFocalPointChange,
					url,
				} );
			} }
		>
			<Icon icon={ chevronRight } />
		</BottomSheet.Cell>
	);
}

export default FocalPointSettings;
