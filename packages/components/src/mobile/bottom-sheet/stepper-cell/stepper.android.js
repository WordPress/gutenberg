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
		<View
			style={ styles.container }
			accesibility={ false }
			importantForAccessibility="no-hide-descendants"
		>
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
					size={ 18 }
					color={ buttonIconStyle.color }
				/>
			</TouchableOpacity>
			<Text style={ valueStyle }>{ value }</Text>
			<TouchableOpacity
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
					size={ 18 }
					color={ buttonIconStyle.color }
				/>
			</TouchableOpacity>
		</View>
	);
}

export default withPreferredColorScheme( Stepper );
