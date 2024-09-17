/**
 * WordPress dependencies
 */
import { useReducedMotion } from '@wordpress/compose';
import { useCallback, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { CONFIG } from '../utils';

// Animation duration (ms) extracted to JS in order to be used on a setTimeout.
const FRAME_ANIMATION_DURATION = CONFIG.transitionDuration;
const FRAME_ANIMATION_DURATION_NUMBER = Number.parseInt(
	CONFIG.transitionDuration
);

const EXIT_ANIMATION_NAME = 'components-modal__disappear-animation';

export function useModalExitAnimation() {
	const frameRef = useRef< HTMLDivElement >();
	const [ isAnimatingOut, setIsAnimatingOut ] = useState( false );
	const isReducedMotion = useReducedMotion();

	const closeModal = useCallback(
		( onAnimationEnd: () => void ) => {
			function handleAnimationEnd( e: AnimationEvent ) {
				if ( e.animationName === EXIT_ANIMATION_NAME ) {
					setIsAnimatingOut( false );
					onAnimationEnd();
				}
			}

			if ( isReducedMotion ) {
				onAnimationEnd();
				return;
			}

			if ( ! frameRef.current ) {
				return;
			}

			// Grab a reference to the frame element, to make sure we're referencing
			// the same reference in the cleanup function.
			const frameEl = frameRef.current;

			setIsAnimatingOut( true );
			frameEl.addEventListener( 'animationend', handleAnimationEnd, {
				once: true,
			} );
			const animationTimeout = window.setTimeout( () => {
				setIsAnimatingOut( false );
				onAnimationEnd();
			}, FRAME_ANIMATION_DURATION_NUMBER );

			return () => {
				frameEl.removeEventListener(
					'animationend',
					handleAnimationEnd
				);
				window.clearTimeout( animationTimeout );
			};
		},
		[ isReducedMotion ]
	);

	return {
		overlayClassname: isAnimatingOut ? 'is-animating-out' : undefined,
		frameRef,
		frameStyle: {
			'--modal-frame-animation-duration': `${ FRAME_ANIMATION_DURATION }ms`,
		},
		closeModal,
	};
}
