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
		() =>
			new Promise< void >( ( closeModalResolve ) => {
				// Grab a "stable" reference of the frame element, since
				// the value held by the react ref might change at runtime.
				const frameEl = frameRef.current;

				if ( isReducedMotion || ! frameEl ) {
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
							FRAME_ANIMATION_DURATION_NUMBER + 1
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
