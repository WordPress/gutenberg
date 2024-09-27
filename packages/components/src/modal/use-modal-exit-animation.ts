/**
 * WordPress dependencies
 */
import { useReducedMotion } from '@wordpress/compose';
import { useCallback, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { CONFIG } from '../utils';
import warning from '@wordpress/warning';

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
		() =>
			new Promise< void >( ( closeModalResolve ) => {
				// Grab a "stable" reference of the frame element, since
				// the value held by the react ref might change at runtime.
				const frameEl = frameRef.current;

				if ( isReducedMotion ) {
					closeModalResolve();
					return;
				}

				if ( ! frameEl ) {
					warning(
						"wp.components.Modal: the Modal component can't be closed with an exit animation because of a missing reference to the modal frame element."
					);
					closeModalResolve();
					return;
				}

				let handleAnimationEnd:
					| undefined
					| ( ( e: AnimationEvent ) => void );

				const startAnimation = () =>
					new Promise< void >( ( animationResolve ) => {
						handleAnimationEnd = ( e: AnimationEvent ) => {
							if ( e.animationName === EXIT_ANIMATION_NAME ) {
								animationResolve();
							}
						};

						frameEl.addEventListener(
							'animationend',
							handleAnimationEnd
						);
						setIsAnimatingOut( true );
					} );
				const animationTimeout = () =>
					new Promise< void >( ( timeoutResolve ) => {
						setTimeout(
							() => timeoutResolve(),
							// Allow an extra 20% of the animation duration for the
							// animationend event to fire, in case the animation frame is
							// slightly delayes by some other events in the event loop.
							FRAME_ANIMATION_DURATION_NUMBER * 1.2
						);
					} );

				Promise.race( [ startAnimation(), animationTimeout() ] ).then(
					() => {
						if ( handleAnimationEnd ) {
							frameEl.removeEventListener(
								'animationend',
								handleAnimationEnd
							);
						}
						setIsAnimatingOut( false );
						closeModalResolve();
					}
				);
			} ),
		[ isReducedMotion ]
	);

	return {
		overlayClassname: isAnimatingOut ? 'is-animating-out' : undefined,
		frameRef,
		frameStyle: {
			'--modal-frame-animation-duration': `${ FRAME_ANIMATION_DURATION }`,
		},
		closeModal,
	};
}
