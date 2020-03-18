/**
 * External dependencies
 */
import { TouchableOpacity, Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withPreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

const PickerButton = ( { icon, label, onPress, getStylesFromColorScheme } ) => {
	const butonStyles = getStylesFromColorScheme(
		styles.button,
		styles.buttonDark
	);
	const butonTextStyles = getStylesFromColorScheme(
		styles.buttonText,
		styles.buttonTextDark
	);

	return (
		<TouchableOpacity
			accessibilityLabel={ label }
			accessibilityHint={ __( 'Double tap to select layout' ) }
			activeOpacity={ 0.7 }
			onPress={ onPress }
			style={ butonStyles }
		>
			<Text style={ styles.buttonIcon }>{ icon }</Text>
			<Text style={ butonTextStyles }>{ label }</Text>
		</TouchableOpacity>
	);
};

export default withPreferredColorScheme( PickerButton );
