/**
 * WordPress dependencies
 */
import {
	useState,
	useLayoutEffect,
	useCallback,
	useMemo,
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
	screenEl?: HTMLElement | null;
} ) {
	const isRTL = isRTLFn();
	const prefersReducedMotion = useReducedMotion();

	const [ animationStatus, setAnimationStatus ] =
		useState< AnimationStatus >( 'INITIAL' );

	// Start enter and exit animations when the screen is selected or deselected.
	// The animation status is set to `*_END` immediately if the animation should
	// be skipped.
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

	// Styles
	const animationDirection =
		( isRTL && isBack ) || ( ! isRTL && ! isBack ) ? 'end' : 'start';
	let animationType: 'in' | 'out' | undefined;
	if ( animationStatus === 'ANIMATING_IN' ) {
		animationType = 'in';
	} else if ( animationStatus === 'ANIMATING_OUT' ) {
		animationType = 'out';
	}
	const animationStyles = useMemo(
		() =>
			styles.navigatorScreenAnimation( {
				skipAnimation,
				animationDirection,
				animationType,
			} ),
		[ skipAnimation, animationDirection, animationType ]
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
