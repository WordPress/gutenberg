/**
 * External dependencies
 */
import { StyleSheet, TouchableOpacity, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './gallery-image-styles';

export function Button( props ) {
	const {
		icon,
		onClick,
		disabled,
		'aria-disabled': ariaDisabled,
		accessibilityLabel = 'button',
		style,
	} = props;

	const buttonStyle = StyleSheet.compose( styles.buttonActive, style );

	const isDisabled = disabled || ariaDisabled;

	const fill = isDisabled ? 'gray' : 'white';

	return (
		<TouchableOpacity
			activeOpacity={ 0.7 }
			accessible={ true }
			accessibilityLabel={ accessibilityLabel }
			accessibilityRole={ 'button' }
			onPress={ onClick }
			disabled={ isDisabled }
		>
			<View style={ buttonStyle }>
				<Icon icon={ icon } fill={ fill } size={ 24 } />
			</View>
		</TouchableOpacity>
	);
}

export default Button;
