/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	createContext,
	useContext,
	useImperativeHandle,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import useShakeAnimation from './animations/shake';

const DEFAULT_CONTEXT_VALUE = {
	shake: noop,
};

const FloatingToolbarAnimationsContext = createContext( DEFAULT_CONTEXT_VALUE );

export const useAnimations = ( ref ) => {
	const shake = useShakeAnimation();

	/**
	 * Some animations are exposed as an imperative handler and added to the FloatingToolbarAnimations context.
	 * This way blocks could trigger animations on the Floating toolbar via the context.
	 */
	useImperativeHandle( ref, () => ( {
		shake: shake.startAnimation,
	} ) );

	return {
		shake: {
			startAnimation: shake.startAnimation,
			animatedValue: shake.animatedValue,
			animationStyle: shake.animationStyle,
		},
	};
};

const FloatingToolbarAnimationsProvider = ( { innerRef, children } ) => {
	const animations = innerRef?.current || {};

	return (
		<FloatingToolbarAnimationsContext.Provider value={ animations }>
			{ children }
		</FloatingToolbarAnimationsContext.Provider>
	);
};

export const useFloatingToolbarAnimationsContext = () =>
	useContext( FloatingToolbarAnimationsContext );

export default FloatingToolbarAnimationsProvider;
