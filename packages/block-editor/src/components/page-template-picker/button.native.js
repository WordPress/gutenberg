/**
 * External dependencies
 */
import { TouchableOpacity, Text, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

const PickerButton = ( { icon, label, onPress } ) => {
	const butonWrapperStyles = usePreferredColorSchemeStyle(
		styles.buttonWrapper,
		styles.buttonWrapperDark
	);
	const buttonStyles = usePreferredColorSchemeStyle(
		styles.button,
		styles.buttonDark
	);
	const buttonTextStyles = usePreferredColorSchemeStyle(
		styles.buttonText,
		styles.buttonTextDark
	);

	return (
		<TouchableOpacity
			accessibilityLabel={ label }
			accessibilityHint={ __( 'Double tap to select layout' ) }
			activeOpacity={ 0.7 }
			onPress={ onPress }
			style={ butonWrapperStyles }
		>
			<View style={ buttonStyles }>
				<Text style={ styles.buttonIcon }>{ icon }</Text>
				<Text style={ buttonTextStyles }>{ label }</Text>
			</View>
		</TouchableOpacity>
	);
};

export default PickerButton;
