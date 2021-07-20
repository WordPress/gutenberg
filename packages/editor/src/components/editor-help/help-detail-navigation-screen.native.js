/**
 * External dependencies
 */
import { View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';

/**
 * WordPress dependencies
 */
import { BottomSheet } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const HelpDetailNavigationScreen = ( { name } ) => {
	const navigation = useNavigation();

	const goBack = () => {
		navigation.goBack();
	};

	return (
		<BottomSheet.NavigationScreen name={ __( 'What is a block?' ) }>
			<BottomSheet.NavigationHeader
				screen={ name }
				leftButtonOnPress={ goBack }
			/>
			<View style={ styles.separator } />
			<Text>Amanda todo</Text>
		</BottomSheet.NavigationScreen>
	);
};

export default HelpDetailNavigationScreen;
