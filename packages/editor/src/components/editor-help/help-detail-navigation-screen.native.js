/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { BottomSheet } from '@wordpress/components';
import { useNavigation } from '@react-navigation/native';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const HelpDetailNavigationScreen = ( { name, content } ) => {
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
			{ content }
		</BottomSheet.NavigationScreen>
	);
};

export default HelpDetailNavigationScreen;
