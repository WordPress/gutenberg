/**
 * External dependencies
 */
import { Animated } from 'react-native';

/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';

// Animation parameters
const SHAKE_TRANSLATION_RANGE = 2;
const SHAKE_DURATION = 300;

// Default animation configuration
const DEFAULT_CONFIG = { intensity: 1 };

// Initial animation value
const ANIMATED_INITIAL_VALUE = 0;

// Animation function
function getShakeAnimation( animatedValue, { intensity } = DEFAULT_CONFIG ) {
	const useNativeDriver = true;
	const duration = SHAKE_DURATION / 4;
	const targetValue = SHAKE_TRANSLATION_RANGE * intensity;
	const sequence = [
		Animated.timing( animatedValue, {
			toValue: targetValue,
			duration,
			useNativeDriver,
		} ),
		Animated.timing( animatedValue, {
			toValue: -targetValue,
			duration,
			useNativeDriver,
		} ),
		Animated.timing( animatedValue, {
			toValue: targetValue,
			duration,
			useNativeDriver,
		} ),
		Animated.timing( animatedValue, {
			toValue: 0,
			duration,
			useNativeDriver,
		} ),
	];
	return Animated.sequence( sequence );
}

function getShakeAnimationStyle( animatedValue ) {
	return { transform: [ { translateY: animatedValue } ] };
}

function useAnimation() {
	const { current: animatedValue } = useRef(
		new Animated.Value( ANIMATED_INITIAL_VALUE )
	);
	const getAnimation = ( config ) =>
		getShakeAnimation( animatedValue, config );
	const animationStyle = getShakeAnimationStyle( animatedValue );

	return { getAnimation, animatedValue, animationStyle };
}

export default useAnimation;
