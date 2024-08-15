/**
 * External dependencies
 */
import { View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import CustomGradientPicker from '../../custom-gradient-picker';
import NavBar from '../bottom-sheet/nav-bar';

const GradientPickerScreen = () => {
	const navigation = useNavigation();
	const route = useRoute();
	const { setColor, currentValue, isGradientColor } = route.params;
	return (
		<View>
			<NavBar>
				<NavBar.BackButton onPress={ navigation.goBack } />
				<NavBar.Heading>{ __( 'Customize Gradient' ) }</NavBar.Heading>
			</NavBar>
			<CustomGradientPicker
				setColor={ setColor }
				currentValue={ currentValue }
				isGradientColor={ isGradientColor }
			/>
		</View>
	);
};

export default GradientPickerScreen;
