/**
 * External dependencies
 */
import {
	Platform,
	TouchableOpacity,
	TouchableNativeFeedback,
	View,
} from 'react-native';

/**
 * WordPress dependencies
 */
import { withPreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import rippleStyles from './ripple.native.scss';

const ANDROID_VERSION_LOLLIPOP = 21;
const ANDROID_VERSION_PIE = 28;

const TouchableRipple = ( {
	style,
	onPress,
	disabled: disabledProp,
	children,
	activeOpacity,
	getStylesFromColorScheme,
	borderless = false,
	...touchableProps
} ) => {
	const isTouchableNativeSupported =
		Platform.OS === 'android' &&
		Platform.Version >= ANDROID_VERSION_LOLLIPOP;

	const disabled = disabledProp || ! onPress;
	const rippleColor = getStylesFromColorScheme(
		rippleStyles.ripple,
		rippleStyles.rippleDark
	).backgroundColor;

	if ( isTouchableNativeSupported ) {
		// A workaround for ripple on Android P is to use useForeground + overflow: 'hidden'
		// https://github.com/facebook/react-native/issues/6480
		const useForeground =
			Platform.OS === 'android' &&
			Platform.Version >= ANDROID_VERSION_PIE &&
			borderless;

		return (
			<TouchableNativeFeedback
				{ ...touchableProps }
				onPress={ onPress }
				disabled={ disabled }
				useForeground={ useForeground }
				background={ TouchableNativeFeedback.Ripple(
					rippleColor,
					borderless
				) }
			>
				<View style={ [ borderless && rippleStyles.overflow, style ] }>
					{ children }
				</View>
			</TouchableNativeFeedback>
		);
	}

	return (
		<TouchableOpacity
			{ ...touchableProps }
			onPress={ onPress }
			disabled={ disabled }
			activeOpacity={ activeOpacity }
			style={ style }
		>
			{ children }
		</TouchableOpacity>
	);
};

export default withPreferredColorScheme( TouchableRipple );
