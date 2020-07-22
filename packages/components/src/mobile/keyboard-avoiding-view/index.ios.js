/**
 * External dependencies
 */
import {
	KeyboardAvoidingView as IOSKeyboardAvoidingView,
	Animated,
	Keyboard,
	Dimensions,
} from 'react-native';

/**
 * WordPress dependencies
 */
import { useState, useEffect, useRef } from '@wordpress/element';

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
	const [ keyboardHeight, setKeyboardHeight ] = useState( 0 );
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

	useEffect( () => {
		animate();
	}, [ keyboardHeight ] );

	function onKeyboardWillShow( { endCoordinates } ) {
		setKeyboardHeight( endCoordinates.height );
	}

	function onKeyboardWillHide() {
		setKeyboardHeight( 0 );
	}

	const paddedKeyboardHeight =
		keyboardHeight + MIN_HEIGHT - ( style.bottom || 0 );

	function animate() {
		Animated.timing( animatedHeight, {
			toValue: keyboardHeight ? paddedKeyboardHeight : MIN_HEIGHT,
			duration: keyboardHeight ? 0 : 150,
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
		/>
	);
};

export default KeyboardAvoidingView;
