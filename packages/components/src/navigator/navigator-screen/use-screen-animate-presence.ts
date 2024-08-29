/**
 * WordPress dependencies
 */
import {
	useEffect,
	useRef,
	useState,
	useLayoutEffect,
	useCallback,
	useMemo,
} from '@wordpress/element';
import { usePrevious, useReducedMotion } from '@wordpress/compose';
import { isRTL as isRTLFn } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import * as styles from '../styles';

const isExitAnimation = ( animationName: string ) =>
	animationName === styles.slideToLeft.name || styles.slideToRight.name;

export function useScreenAnimatePresence( {
	isMatch,
	skipAnimation,
	isBack,
	onAnimationEnd,
}: {
	isMatch: boolean;
	skipAnimation: boolean;
	isBack?: boolean;
	onAnimationEnd?: React.AnimationEventHandler< Element >;
} ) {
	// Possible values:
	// - idle: first value assigned to the screen when added to the React tree
	// - armed: will start an exit animation when deselected
	// - animating: the exit animation is happening
	// - animated: the exit animation has ended
	const [ exitAnimationStatus, setExitAnimationStatus ] = useState<
		'idle' | 'armed' | 'animating' | 'animated'
	>( 'idle' );

	const isRTL = isRTLFn();
	const animationTimeoutRef = useRef< number >();
	const prefersReducedMotion = useReducedMotion();

	const wasMatch = usePrevious( isMatch );

	// Update animation status.
	useLayoutEffect( () => {
		if ( ! wasMatch && isMatch ) {
			// When the screen becomes selected, set it to 'armed',
			// meaning that it will start an exit animation when deselected.
			setExitAnimationStatus( 'armed' );
		} else if ( wasMatch && ! isMatch ) {
			// When the screen becomes deselected, set it to:
			// - 'animating' (if animations are enabled)
			// - 'animated' (causing the animation to end and the screen to stop
			//    rendering its contents in the DOM, without the need to wait for
			//    the `animationend` event)
			setExitAnimationStatus(
				skipAnimation || prefersReducedMotion ? 'animated' : 'animating'
			);
		}
	}, [ isMatch, wasMatch, skipAnimation, prefersReducedMotion ] );

	// Fallback timeout to ensure the screen is removed from the DOM in case the
	// `animationend` event is not triggered.
	useEffect( () => {
		if ( exitAnimationStatus === 'animating' ) {
			animationTimeoutRef.current = window.setTimeout( () => {
				setExitAnimationStatus( 'animated' );
				animationTimeoutRef.current = undefined;
			}, styles.TOTAL_ANIMATION_DURATION_OUT );
		} else if ( animationTimeoutRef.current ) {
			window.clearTimeout( animationTimeoutRef.current );
			animationTimeoutRef.current = undefined;
		}
	}, [ exitAnimationStatus ] );

	const onScreenAnimationEnd = useCallback(
		( e: React.AnimationEvent< HTMLElement > ) => {
			onAnimationEnd?.( e );

			if ( ! isMatch && isExitAnimation( e.animationName ) ) {
				// When the exit animation ends on an unselected screen, set the
				// status to 'animated' to remove the screen contents from the DOM.
				setExitAnimationStatus( 'animated' );
			}
		},
		[ onAnimationEnd, isMatch ]
	);

	// Styles
	const animationDirection =
		( isRTL && isBack ) || ( ! isRTL && ! isBack )
			? 'forwards'
			: 'backwards';
	const isAnimatingOut =
		exitAnimationStatus === 'animating' ||
		exitAnimationStatus === 'animated';
	const animationStyles = useMemo(
		() =>
			styles.navigatorScreenAnimation( {
				skipAnimation,
				animationDirection,
				isAnimatingOut,
			} ),
		[ skipAnimation, animationDirection, isAnimatingOut ]
	);

	return {
		animationStyles,
		// Remove the screen contents from the DOM only when it not selected
		// and its exit animation has ended.
		shouldRenderScreen:
			isMatch ||
			exitAnimationStatus === 'armed' ||
			exitAnimationStatus === 'animating',
		onAnimationEnd: onScreenAnimationEnd,
	} as const;
}
