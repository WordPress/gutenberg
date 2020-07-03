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
	const animatedHeight = useRef( new Animated.Value( 44 ) ).current;

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
		keyboardHeight +
		( style.bottom ? MIN_HEIGHT - style.bottom : MIN_HEIGHT );

	function animate() {
		Animated.timing( animatedHeight, {
			toValue: keyboardHeight ? paddedKeyboardHeight : MIN_HEIGHT,
			duration: keyboardHeight ? 0 : 150,
		} ).start();
	}

	return (
		<AnimatedKeyboardAvoidingView
			{ ...otherProps }
			behavior="padding"
			keyboardVerticalOffset={ keyboardVerticalOffset }
			style={ [
				style,
				withAnimatedHeight && { height: animatedHeight },
			] }
		/>
	);
};

export default KeyboardAvoidingView;
