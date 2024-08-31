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

const isEnterAnimation = (
	animationDirection: 'forwards' | 'backwards',
	animationStatus: AnimationStatus,
	animationName: string
) =>
	animationStatus === 'ANIMATING_IN' &&
	animationName === styles.ANIMATION_END_NAMES[ animationDirection ].in;

const isExitAnimation = (
	animationDirection: 'forwards' | 'backwards',
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
	screenEl,
	setWrapperHeight,
}: {
	isMatch: boolean;
	skipAnimation: boolean;
	isBack?: boolean;
	onAnimationEnd?: React.AnimationEventHandler< Element >;
	screenEl?: HTMLElement | null;
	setWrapperHeight?: ( height: number | undefined ) => void;
} ) {
	const isRTL = isRTLFn();
	const animationTimeoutRef = useRef< number >();
	const prefersReducedMotion = useReducedMotion();

	const [ animationStatus, setAnimationStatus ] =
		useState< AnimationStatus >( 'INITIAL' );

	const wasMatch = usePrevious( isMatch );

	const screenHeightRef = useRef< number | undefined >();

	// Start enter and exit animations when the screen is selected or deselected.
	// The animation status is set to `*_END` immediately if the animation should
	// be skipped.
	useLayoutEffect( () => {
		if ( ! wasMatch && isMatch ) {
			screenHeightRef.current = undefined;
			setAnimationStatus(
				skipAnimation || prefersReducedMotion ? 'IN' : 'ANIMATING_IN'
			);
		} else if ( wasMatch && ! isMatch ) {
			screenHeightRef.current = screenEl?.offsetHeight;
			setAnimationStatus(
				skipAnimation || prefersReducedMotion ? 'OUT' : 'ANIMATING_OUT'
			);
		}
	}, [ isMatch, wasMatch, skipAnimation, prefersReducedMotion, screenEl ] );

	// When starting an animation, set the wrapper height to the screen height,
	// to prevent layout shifts during the animation.
	useEffect( () => {
		if ( animationStatus === 'ANIMATING_OUT' ) {
			setWrapperHeight?.( screenHeightRef.current ?? 0 );
		} else if ( animationStatus === 'OUT' ) {
			setWrapperHeight?.( undefined );
		}
	}, [ screenEl, animationStatus, setWrapperHeight ] );

	// Fallback timeout to ensure the screen is removed from the DOM in case the
	// `animationend` event is not triggered.
	useEffect( () => {
		if ( animationStatus === 'ANIMATING_OUT' ) {
			animationTimeoutRef.current = window.setTimeout( () => {
				// setAnimationStatus( 'OUT' );
				animationTimeoutRef.current = undefined;
			}, styles.TOTAL_ANIMATION_DURATION_OUT );
		} else if ( animationTimeoutRef.current ) {
			window.clearTimeout( animationTimeoutRef.current );
			animationTimeoutRef.current = undefined;
		}
	}, [ animationStatus ] );

	// Styles
	const animationDirection =
		( isRTL && isBack ) || ( ! isRTL && ! isBack )
			? 'forwards'
			: 'backwards';
	const isAnimatingOut = animationStatus === 'ANIMATING_OUT';
	const isAnimatingIn = animationStatus === 'ANIMATING_IN';
	const animationStyles = useMemo(
		() =>
			styles.navigatorScreenAnimation( {
				skipAnimation,
				animationDirection,
				isAnimatingIn,
				isAnimatingOut,
			} ),
		[ skipAnimation, animationDirection, isAnimatingOut, isAnimatingIn ]
	);

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

	return {
		animationStyles,
		// Render the screen's contents in the DOM not only when the screen is
		// selected, but also while it is animating out.
		shouldRenderScreen:
			isMatch ||
			animationStatus === 'IN' ||
			animationStatus === 'ANIMATING_OUT',
		onAnimationEnd: onScreenAnimationEnd,
	} as const;
}
