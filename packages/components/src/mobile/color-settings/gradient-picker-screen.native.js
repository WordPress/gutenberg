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
import Header from '../bottom-sheet/header';

const GradientPickerScreen = () => {
	const navigation = useNavigation();
	const route = useRoute();
	const { setColor, currentValue, isGradientColor } = route.params;
	return (
		<View>
			<Header>
				<Header.BackButton onPress={ navigation.goBack } />
				<Header.Title>{ __( 'Customize Gradient' ) }</Header.Title>
			</Header>
			<CustomGradientPicker
				setColor={ setColor }
				currentValue={ currentValue }
				isGradientColor={ isGradientColor }
			/>
		</View>
	);
};

export default GradientPickerScreen;
