/**
 * External dependencies
 */
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import CustomGradientPicker from '../../custom-gradient-picker';
import NavigationHeader from '../bottom-sheet/navigation-header';

const GradientPickerScreen = () => {
	const navigation = useNavigation();
	return (
		<View>
			<NavigationHeader
				screen={ __( 'Customize Gradient' ) }
				leftButtonOnPress={ navigation.goBack }
			/>
			<CustomGradientPicker />
		</View>
	);
};

export default GradientPickerScreen;
