/**
 * External dependencies
 */
import { Text, TouchableOpacity, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { Icon, chevronDown, chevronUp } from '@wordpress/icons';
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
	shouldDisplayTextInput,
	children,
} ) {
	const valueStyle = getStylesFromColorScheme(
		styles.value,
		styles.valueTextDark
	);
	const buttonIconStyle = getStylesFromColorScheme(
		styles.buttonNoBg,
		styles.buttonNoBgTextDark
	);

	return (
		<View style={ styles.container }>
			<TouchableOpacity
				disabled={ isMinValue }
				onPressIn={ onPressInDecrement }
				onPressOut={ onPressOut }
				style={ [
					styles.buttonNoBg,
					isMinValue ? { opacity: 0.4 } : null,
				] }
			>
				<Icon
					icon={ chevronDown }
					size={ 24 }
					color={ buttonIconStyle.color }
				/>
			</TouchableOpacity>
			{ ! shouldDisplayTextInput && (
				<Text style={ [ valueStyle, styles.spacings ] }>{ value }</Text>
			) }
			{ children }
			<TouchableOpacity
				testID={ 'Increment' }
				disabled={ isMaxValue }
				onPressIn={ onPressInIncrement }
				onPressOut={ onPressOut }
				style={ [
					styles.buttonNoBg,
					isMaxValue ? { opacity: 0.4 } : null,
				] }
			>
				<Icon
					icon={ chevronUp }
					size={ 24 }
					color={ buttonIconStyle.color }
				/>
			</TouchableOpacity>
		</View>
	);
}

export default withPreferredColorScheme( Stepper );
