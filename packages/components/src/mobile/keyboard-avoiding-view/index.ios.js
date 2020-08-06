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

/**
 * WordPress dependencies
 */
import { useState, useEffect, useRef } from '@wordpress/element';
import { useResizeObserver } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

const AnimatedKeyboardAvoidingView = Animated.createAnimatedComponent(
	IOSKeyboardAvoidingView
);

const MIN_HEIGHT = 44;
const ANIMATION_DURATION = 200;

export const KeyboardAvoidingView = ( {
	parentHeight,
	style,
	withAnimatedHeight = false,
	...otherProps
} ) => {
	const [ keyboardHeight, setKeyboardHeight ] = useState( 0 );
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
		if ( keyboardHeight ) {
			animatedHeight.setValue( paddedKeyboardHeight );
		} else
			Animated.timing( animatedHeight, {
				toValue: MIN_HEIGHT,
				duration: ANIMATION_DURATION,
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
