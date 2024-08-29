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

const isEnterAnimation = ( animationName: string ) =>
	animationName === styles.slideFromLeft.name || styles.slideFromRight.name;
const isExitAnimation = ( animationName: string ) =>
	animationName === styles.slideToLeft.name || styles.slideToRight.name;

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

	// Possible values:
	// - 'INITIAL': the initial state
	// - 'IN_START': start enter animation
	// - 'IN_END': enter animation has ended
	// - 'OUT_START': start exit animation
	// - 'OUT_END': the exit animation has ended
	const [ animationStatus, setAnimationStatus ] = useState<
		'INITIAL' | 'IN_START' | 'IN_END' | 'OUT_START' | 'OUT_END'
	>( 'INITIAL' );

	const wasMatch = usePrevious( isMatch );

	const screenHeightRef = useRef< number | undefined >();

	// Start enter and exit animations when the screen is selected or deselected.
	// The animation status is set to `*_END` immediately if the animation should
	// be skipped.
	useLayoutEffect( () => {
		if ( ! wasMatch && isMatch ) {
			screenHeightRef.current = undefined;
			setAnimationStatus(
				skipAnimation || prefersReducedMotion ? 'IN_END' : 'IN_START'
			);
		} else if ( wasMatch && ! isMatch ) {
			screenHeightRef.current = screenEl?.offsetHeight;
			setAnimationStatus(
				skipAnimation || prefersReducedMotion ? 'OUT_END' : 'OUT_START'
			);
		}
	}, [ isMatch, wasMatch, skipAnimation, prefersReducedMotion, screenEl ] );

	// When starting an animation, set the wrapper height to the screen height,
	// to prevent layout shifts during the animation.
	useEffect( () => {
		if ( animationStatus === 'OUT_START' ) {
			setWrapperHeight?.( screenHeightRef.current ?? 0 );
		} else if ( animationStatus === 'OUT_END' ) {
			setWrapperHeight?.( undefined );
		}
	}, [ screenEl, animationStatus, setWrapperHeight ] );

	// Fallback timeout to ensure the screen is removed from the DOM in case the
	// `animationend` event is not triggered.
	useEffect( () => {
		if ( animationStatus === 'OUT_START' ) {
			animationTimeoutRef.current = window.setTimeout( () => {
				setAnimationStatus( 'OUT_END' );
				animationTimeoutRef.current = undefined;
			}, styles.TOTAL_ANIMATION_DURATION_OUT );
		} else if ( animationTimeoutRef.current ) {
			window.clearTimeout( animationTimeoutRef.current );
			animationTimeoutRef.current = undefined;
		}
	}, [ animationStatus ] );

	const onScreenAnimationEnd = useCallback(
		( e: React.AnimationEvent< HTMLElement > ) => {
			onAnimationEnd?.( e );

			if ( ! isMatch && isExitAnimation( e.animationName ) ) {
				// When the exit animation ends on an unselected screen, set the
				// status to 'OUT_END' to remove the screen contents from the DOM.
				setAnimationStatus( 'OUT_END' );
			} else if ( isMatch && isEnterAnimation( e.animationName ) ) {
				// When the enter animation ends on a selected screen, set the
				// status to 'IN_END' to ensure the screen is rendered in the DOM.
				setAnimationStatus( 'IN_END' );
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
		animationStatus === 'OUT_START' || animationStatus === 'OUT_END';
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
		// Render the screen's contents in the DOM not only when the screen is
		// selected, but also while it is animating out.
		shouldRenderScreen:
			isMatch ||
			animationStatus === 'IN_END' ||
			animationStatus === 'OUT_START',
		onAnimationEnd: onScreenAnimationEnd,
	} as const;
}
