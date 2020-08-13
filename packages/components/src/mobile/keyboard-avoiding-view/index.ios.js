/**
 * External dependencies
 */
import {
	KeyboardAvoidingView as IOSKeyboardAvoidingView,
	Animated,
	Keyboard,
	Dimensions,
	View,
} from 'react-native';
import SafeArea from 'react-native-safe-area';

/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { useResizeObserver } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

const AnimatedKeyboardAvoidingView = Animated.createAnimatedComponent(
	IOSKeyboardAvoidingView
);

const MIN_HEIGHT = 44;

export const KeyboardAvoidingView = ( {
	parentHeight,
	style,
	withAnimatedHeight = false,
	...otherProps
} ) => {
	const [ resizeObserver, sizes ] = useResizeObserver();
	const { height = 0 } = sizes || {};

	const animatedHeight = useRef( new Animated.Value( MIN_HEIGHT ) ).current;

	const { height: fullHeight } = Dimensions.get( 'window' );
	const keyboardVerticalOffset = fullHeight - parentHeight;

	useEffect( () => {
		Keyboard.addListener( 'keyboardWillShow', onKeyboardWillShow );
		Keyboard.addListener( 'keyboardWillHide', onKeyboardWillHide );
		return () => {
			Keyboard.removeListener( 'keyboardWillShow', onKeyboardWillShow );
			Keyboard.removeListener( 'keyboardWillHide', onKeyboardWillHide );
		};
	}, [] );

	function onKeyboardWillShow( { endCoordinates } ) {
		SafeArea.getSafeAreaInsetsForRootView().then( ( result ) => {
			animatedHeight.setValue(
				endCoordinates.height +
					MIN_HEIGHT -
					result.safeAreaInsets.bottom
			);
		} );
	}

	function onKeyboardWillHide( { duration } ) {
		Animated.timing( animatedHeight, {
			toValue: MIN_HEIGHT,
			duration,
			useNativeDriver: false,
		} ).start();
	}

	return (
		<AnimatedKeyboardAvoidingView
			{ ...otherProps }
			behavior="padding"
			keyboardVerticalOffset={ keyboardVerticalOffset }
			style={
				withAnimatedHeight
					? [ style, { height: animatedHeight } ]
					: style
			}
		>
			<View
				style={ [
					{
						top: -height + MIN_HEIGHT,
					},
					styles.animatedChildStyle,
					! withAnimatedHeight && styles.defaultChildStyle,
				] }
			>
				{ resizeObserver }
				{ otherProps.children }
			</View>
		</AnimatedKeyboardAvoidingView>
	);
};

export default KeyboardAvoidingView;
