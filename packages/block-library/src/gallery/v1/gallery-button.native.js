/**
 * External dependencies
 */
import { StyleSheet, TouchableOpacity } from 'react-native';

/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/components';

/**
 * Internal dependencies
 */
import style from './gallery-image-style.scss';

export function Button( props ) {
	const {
		icon,
		iconSize = 24,
		onClick,
		disabled,
		'aria-disabled': ariaDisabled,
		accessibilityLabel = 'button',
		style: customStyle,
	} = props;

	const buttonStyle = StyleSheet.compose( style.buttonActive, customStyle );

	const isDisabled = disabled || ariaDisabled;

	const { fill } = isDisabled ? style.buttonDisabled : style.button;

	return (
		<TouchableOpacity
			style={ buttonStyle }
			activeOpacity={ 0.7 }
			accessibilityLabel={ accessibilityLabel }
			accessibilityRole={ 'button' }
			onPress={ onClick }
			disabled={ isDisabled }
		>
			<Icon icon={ icon } fill={ fill } size={ iconSize } />
		</TouchableOpacity>
	);
}

export default Button;
