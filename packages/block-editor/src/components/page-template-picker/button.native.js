/**
 * External dependencies
 */
import { TouchableOpacity, Text, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	Icon,
} from '@wordpress/components';
import { withPreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

const PickerButton = ( {
	icon,
	label,
	onPress,
	getStylesFromColorScheme,
} ) => {
	const butonStyles = getStylesFromColorScheme( styles.button, styles.buttonDark );
	const butonTextStyles = getStylesFromColorScheme( styles.buttonText, styles.buttonTextDark );
	const accessibilityLabel = sprintf(
		/* translators: accessibility text. Inform about list of predefined layout options. %1$s: Layout name, e.g About. */
		__( 'Predefined layout picker. %1$s' ),
		label
	);

	return (
		<TouchableOpacity
			accessibilityLabel={ accessibilityLabel }
			activeOpacity={ 0.7 }
			onPress={ onPress }
			style={ butonStyles }
		>
			<View style={ styles.buttonIconContent }><Icon icon={ icon } { ...styles.buttonIcon } /></View>
			<Text style={ butonTextStyles }>{ label }</Text>
		</TouchableOpacity>
	);
};

export default withPreferredColorScheme( PickerButton );
