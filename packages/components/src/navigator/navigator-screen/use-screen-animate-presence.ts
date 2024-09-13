/**
 * WordPress dependencies
 */
import { useState, useEffect, useCallback } from '@wordpress/element';
import { useReducedMotion } from '@wordpress/compose';
import { isRTL as isRTLFn } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import * as styles from '../styles';

type AnimationStatus =
	| 'HIDDEN'
	| 'WILL_ANIMATE_IN'
	| 'ANIMATING_IN'
	| 'VISIBLE'
	| 'ANIMATING_OUT';
type AnimationDirection = 'to-left' | 'to-right';

const computeAnimationDirection = ( isRTL: boolean, isBack?: boolean ) => {
	if ( isBack ) {
		return isRTL ? 'to-left' : 'to-right';
	}
	return isRTL ? 'to-right' : 'to-left';
};

export function useScreenAnimatePresence( {
	isMatch,
	skipAnimation,
	isBack,
	onTransitionEnd,
	ref,
}: {
	isMatch: boolean;
	skipAnimation: boolean;
	isBack?: boolean;
	onTransitionEnd?: React.TransitionEventHandler< Element >;
	screenEl?: HTMLElement | null;
	ref: React.RefObject< HTMLElement >;
} ) {
	const isRTL = isRTLFn();
	const prefersReducedMotion = useReducedMotion();

	const [ animationState, setAnimationState ] = useState< {
		animationStatus: AnimationStatus;
		animationDirection: AnimationDirection;
	} >( {
		animationStatus: 'HIDDEN',
		animationDirection: computeAnimationDirection( isRTL, isBack ),
	} );

	const { animationStatus, animationDirection } = animationState;

	// Start enter and exit animations when the screen is selected or deselected.
	// The animation status is set to `*_END` immediately if the animation should
	// be skipped.
	useEffect( () => {
		const shouldNotAnimate = skipAnimation || prefersReducedMotion;
		const direction = computeAnimationDirection( isRTL, isBack );

		if (
			isMatch &&
			( animationStatus === 'HIDDEN' ||
				animationStatus === 'ANIMATING_OUT' )
		) {
			// Get ready to animate in. This step is necessary to allow the initial
			// transform and opacity values to be applied before starting the
			// transition.
			setAnimationState( {
				animationStatus: shouldNotAnimate
					? 'VISIBLE'
					: 'WILL_ANIMATE_IN',
				animationDirection: direction,
			} );
		} else if ( isMatch && animationStatus === 'WILL_ANIMATE_IN' ) {
			// Start the animation.
			requestAnimationFrame( () =>
				setAnimationState( {
					animationStatus: shouldNotAnimate
						? 'VISIBLE'
						: 'ANIMATING_IN',
					animationDirection: direction,
				} )
			);
		} else if (
			! isMatch &&
			( animationStatus === 'VISIBLE' ||
				animationStatus === 'ANIMATING_IN' ||
				animationStatus === 'WILL_ANIMATE_IN' )
		) {
			setAnimationState( {
				animationStatus: shouldNotAnimate ? 'HIDDEN' : 'ANIMATING_OUT',
				animationDirection: direction,
			} );
		}
	}, [
		animationStatus,
		isMatch,
		skipAnimation,
		prefersReducedMotion,
		isRTL,
		isBack,
	] );

	const onScreenTransitionEnd = useCallback(
		( e: React.TransitionEvent< HTMLElement > ) => {
			onTransitionEnd?.( e );

			if (
				// Filter out all transitionend events that are not
				// triggered by the screen element itself.
				e.target !== ref.current ||
				// The transform property is the one that takes the longest to animate
				// for the screen's specific animation.
				e.propertyName !== 'transform'
			) {
				return;
			}

			if ( animationStatus === 'ANIMATING_OUT' ) {
				// When the exit animation ends on an unselected screen, set the
				// status to 'OUT' to remove the screen contents from the DOM.
				setAnimationState( ( prevState ) => ( {
					...prevState,
					animationStatus: 'HIDDEN',
				} ) );
			} else if ( animationStatus === 'ANIMATING_IN' ) {
				// When the enter animation ends on a selected screen, set the
				// status to 'VISIBLE' to ensure the screen is rendered in the DOM.
				setAnimationState( ( prevState ) => ( {
					...prevState,
					animationStatus: 'VISIBLE',
				} ) );
			}
		},
		[ ref, onTransitionEnd, animationStatus ]
	);

	return {
		animationStyles: styles.navigatorScreenAnimation,
		// Render the screen's contents in the DOM not only when the screen is
		// selected, but also while it is animating out.
		shouldRenderScreen: animationStatus !== 'HIDDEN',
		screenProps: {
			onTransitionEnd: onScreenTransitionEnd,
			'data-animation-skip': skipAnimation || undefined,
			'data-animation-direction': animationDirection,
			'data-animation-in':
				animationStatus !== 'HIDDEN' &&
				animationStatus !== 'WILL_ANIMATE_IN'
					? ''
					: undefined,
			'data-animation-out':
				animationStatus === 'ANIMATING_OUT' ? '' : undefined,
		},
	} as const;
}
