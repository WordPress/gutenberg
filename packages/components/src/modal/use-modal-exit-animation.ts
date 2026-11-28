import { useReducedMotion } from '@wordpress/compose';
import { useCallback, useRef, useState } from '@wordpress/element';
import warning from '@wordpress/warning';

const EXIT_ANIMATION_NAME = 'components-modal__disappear-animation';

export function useModalExitAnimation() {
	const frameRef = useRef< HTMLDivElement >( null );
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

				// Read the rendered duration so the fallback follows the CSS motion token.
				const animationDuration =
					Number.parseFloat(
						frameEl.ownerDocument.defaultView?.getComputedStyle(
							frameEl
						).animationDuration || '0'
					) * 1000;

				let handleAnimationEnd:
					undefined | ( ( e: AnimationEvent ) => void );

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
							// slightly delayed by some other events in the event loop.
							animationDuration * 1.2
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
		closeModal,
	};
}
