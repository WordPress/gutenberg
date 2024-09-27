/**
 * WordPress dependencies
 */
import {
	useState,
	useEffect,
	useLayoutEffect,
	useCallback,
} from '@wordpress/element';
import { useReducedMotion } from '@wordpress/compose';
import { isRTL as isRTLFn } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import * as styles from '../styles';

// Possible values:
// - 'INITIAL': the initial state
// - 'ANIMATING_IN': start enter animation
// - 'IN': enter animation has ended
// - 'ANIMATING_OUT': start exit animation
// - 'OUT': the exit animation has ended
type AnimationStatus =
	| 'INITIAL'
	| 'ANIMATING_IN'
	| 'IN'
	| 'ANIMATING_OUT'
	| 'OUT';

// Allow an extra 20% of the total animation duration to account for potential
// event loop delays.
const ANIMATION_TIMEOUT_MARGIN = 1.2;

const isEnterAnimation = (
	animationDirection: 'end' | 'start',
	animationStatus: AnimationStatus,
	animationName: string
) =>
	animationStatus === 'ANIMATING_IN' &&
	animationName === styles.ANIMATION_END_NAMES[ animationDirection ].in;

const isExitAnimation = (
	animationDirection: 'end' | 'start',
	animationStatus: AnimationStatus,
	animationName: string
) =>
	animationStatus === 'ANIMATING_OUT' &&
	animationName === styles.ANIMATION_END_NAMES[ animationDirection ].out;

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
	const isRTL = isRTLFn();
	const prefersReducedMotion = useReducedMotion();

	const [ animationStatus, setAnimationStatus ] =
		useState< AnimationStatus >( 'INITIAL' );

	// Start enter and exit animations when the screen is selected or deselected.
	// The animation status is set to `IN` or `OUT` immediately if the animation
	// should be skipped.
	const becameSelected =
		animationStatus !== 'ANIMATING_IN' &&
		animationStatus !== 'IN' &&
		isMatch;
	const becameUnselected =
		animationStatus !== 'ANIMATING_OUT' &&
		animationStatus !== 'OUT' &&
		! isMatch;
	useLayoutEffect( () => {
		if ( becameSelected ) {
			setAnimationStatus(
				skipAnimation || prefersReducedMotion ? 'IN' : 'ANIMATING_IN'
			);
		} else if ( becameUnselected ) {
			setAnimationStatus(
				skipAnimation || prefersReducedMotion ? 'OUT' : 'ANIMATING_OUT'
			);
		}
	}, [
		becameSelected,
		becameUnselected,
		skipAnimation,
		prefersReducedMotion,
	] );

	// Animation attributes (derived state).
	const animationDirection =
		( isRTL && isBack ) || ( ! isRTL && ! isBack ) ? 'end' : 'start';
	const isAnimatingIn = animationStatus === 'ANIMATING_IN';
	const isAnimatingOut = animationStatus === 'ANIMATING_OUT';
	let animationType: 'in' | 'out' | undefined;
	if ( isAnimatingIn ) {
		animationType = 'in';
	} else if ( isAnimatingOut ) {
		animationType = 'out';
	}

	const onScreenAnimationEnd = useCallback(
		( e: React.AnimationEvent< HTMLElement > ) => {
			onAnimationEnd?.( e );

			if (
				isExitAnimation(
					animationDirection,
					animationStatus,
					e.animationName
				)
			) {
				// When the exit animation ends on an unselected screen, set the
				// status to 'OUT' to remove the screen contents from the DOM.
				setAnimationStatus( 'OUT' );
			} else if (
				isEnterAnimation(
					animationDirection,
					animationStatus,
					e.animationName
				)
			) {
				// When the enter animation ends on a selected screen, set the
				// status to 'IN' to ensure the screen is rendered in the DOM.
				setAnimationStatus( 'IN' );
			}
		},
		[ onAnimationEnd, animationStatus, animationDirection ]
	);

	// Fallback timeout to ensure that the logic is applied even if the
	// `animationend` event is not triggered.
	useEffect( () => {
		let animationTimeout: number | undefined;

		if ( isAnimatingOut ) {
			animationTimeout = window.setTimeout( () => {
				setAnimationStatus( 'OUT' );
				animationTimeout = undefined;
			}, styles.TOTAL_ANIMATION_DURATION.OUT * ANIMATION_TIMEOUT_MARGIN );
		} else if ( isAnimatingIn ) {
			animationTimeout = window.setTimeout( () => {
				setAnimationStatus( 'IN' );
				animationTimeout = undefined;
			}, styles.TOTAL_ANIMATION_DURATION.IN * ANIMATION_TIMEOUT_MARGIN );
		}

		return () => {
			if ( animationTimeout ) {
				window.clearTimeout( animationTimeout );
				animationTimeout = undefined;
			}
		};
	}, [ isAnimatingOut, isAnimatingIn ] );

	return {
		animationStyles: styles.navigatorScreenAnimation,
		// Render the screen's contents in the DOM not only when the screen is
		// selected, but also while it is animating out.
		shouldRenderScreen:
			isMatch ||
			animationStatus === 'IN' ||
			animationStatus === 'ANIMATING_OUT',
		screenProps: {
			onAnimationEnd: onScreenAnimationEnd,
			'data-animation-direction': animationDirection,
			'data-animation-type': animationType,
			'data-skip-animation': skipAnimation || undefined,
		},
	} as const;
}
