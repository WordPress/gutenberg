/**
 * External dependencies
 */
import {
	Platform,
	TouchableHighlight,
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
	children: rippleChildren,
	accessible,
	accessibilityLabel,
	accessibilityRole,
	accessibilityHint,
	activeOpacity,
	getStylesFromColorScheme,
} ) => {
	const borderless = false;

	const isTouchableNativeSupported =
		Platform.OS === 'android' &&
		Platform.Version >= ANDROID_VERSION_LOLLIPOP;

	const useTouchableOpacity = Platform.OS === 'ios';

	const disabled = disabledProp || ! onPress;
	const rippleColor = getStylesFromColorScheme(
		rippleStyles.ripple,
		rippleStyles.rippleDark
	);

	const TouchableComponentWrapper = ( {
		component: TouchableComponent,
		children,
		...rest
	} ) => (
		<TouchableComponent
			accessible={ accessible }
			accessibilityLabel={ accessibilityLabel }
			accessibilityRole={ accessibilityRole }
			accessibilityHint={ accessibilityHint }
			disabled={ disabled }
			onPress={ onPress }
			{ ...rest }
		>
			{ children }
		</TouchableComponent>
	);

	if ( isTouchableNativeSupported ) {
		// A workaround for ripple on Android P is to use useForeground + overflow: 'hidden'
		// https://github.com/facebook/react-native/issues/6480
		const useForeground =
			Platform.OS === 'android' &&
			Platform.Version >= ANDROID_VERSION_PIE &&
			borderless;

		return (
			<TouchableComponentWrapper
				component={ TouchableNativeFeedback }
				useForeground={ useForeground }
				background={ TouchableNativeFeedback.Ripple(
					rippleColor,
					borderless
				) }
			>
				<View style={ [ borderless && rippleStyles.overflow, style ] }>
					{ rippleChildren }
				</View>
			</TouchableComponentWrapper>
		);
	}

	return useTouchableOpacity ? (
		<TouchableComponentWrapper
			component={ TouchableOpacity }
			activeOpacity={ activeOpacity }
			style={ style }
		/>
	) : (
		<TouchableComponentWrapper
			component={ TouchableHighlight }
			style={ [ borderless && rippleStyles.overflow, style ] }
			underlayColor={ rippleColor }
		/>
	);
};

export default withPreferredColorScheme( TouchableRipple );
