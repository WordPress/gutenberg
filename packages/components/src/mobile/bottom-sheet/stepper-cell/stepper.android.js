/**
 * External dependencies
 */
import { Text, TouchableOpacity, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Dashicon } from '@wordpress/components';
import { withPreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './style.scss';

function Stepper( {
	getStylesFromColorScheme,
	isMaxValue,
	isMinValue,
	onPressInDecrement,
	onPressInIncrement,
	onPressOut,
	value,
} ) {
	const valueStyle = getStylesFromColorScheme( styles.value, styles.valueTextDark );
	const buttonIconStyle = getStylesFromColorScheme( styles.buttonNoBg, styles.buttonNoBgTextDark );

	return (
		<View style={ styles.container }>
			<TouchableOpacity
				accessible={ true }
				accessibilityHint={
					/* translators: accessibility text (hint to decrement the value) */
					__( 'Double tap to decrement the value' )
				}
				accessibilityState={ {
					disabled: isMinValue,
				} }
				disabled={ isMinValue }
				onPressIn={ onPressInDecrement }
				onPressOut={ onPressOut }
				role="button"
				style={ [ styles.buttonNoBg, isMinValue ? { opacity: 0.4 } : null ] }
			>
				<Dashicon icon="arrow-down-alt2" size={ 18 } color={ buttonIconStyle.color } />
			</TouchableOpacity>
			<Text style={ valueStyle }>{ value }</Text>
			<TouchableOpacity
				accessible={ true }
				accessibilityHint={
					/* translators: accessibility text (hint to increment the value) */
					__( 'Double tap to increment the value' )
				}
				accessibilityState={ {
					disabled: isMaxValue,
				} }
				disabled={ isMaxValue }
				onPressIn={ onPressInIncrement }
				onPressOut={ onPressOut }
				role="button"
				style={ [ styles.buttonNoBg, isMaxValue ? { opacity: 0.4 } : null ] }
			>
				<Dashicon icon="arrow-up-alt2" size={ 18 } color={ buttonIconStyle.color } />
			</TouchableOpacity>
		</View>
	);
}

export default withPreferredColorScheme( Stepper );
