/**
 * External dependencies
 */
import { TouchableOpacity, Text, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
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

	return (
		<TouchableOpacity
			accessibilityLabel={ label }
			accessibilityHint={ __( 'Double tap to select layout' ) }
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
