/**
 * External dependencies
 */
import { Controller, easings } from '@react-spring/web';

/**
 * WordPress dependencies
 */
import { useLayoutEffect, useMemo, useRef } from '@wordpress/element';

function getAbsolutePosition( element ) {
	return {
		top: element.offsetTop,
		left: element.offsetLeft,
	};
}

const ANIMATION_DURATION = 400;

/**
 * Hook used to compute the styles required to move a div into a new position.
 *
 * The way this animation works is the following:
 *  - It first renders the element as if there was no animation.
 *  - It takes a snapshot of the position of the block to use it
 *    as a destination point for the animation.
 *  - It restores the element to the previous position using a CSS transform
 *  - It uses the "resetAnimation" flag to reset the animation
 *    from the beginning in order to animate to the new destination point.
 *
 * @param {Object} $1                          Options
 * @param {*}      $1.triggerAnimationOnChange Variable used to trigger the animation if it changes.
 */
function useMovingAnimation( { triggerAnimationOnChange } ) {
	const ref = useRef();

	// Whenever the trigger changes, we need to take a snapshot of the current
	// position of the block to use it as a destination point for the animation.
	const { previous, prevRect } = useMemo(
		() => ( {
			previous: ref.current && getAbsolutePosition( ref.current ),
			prevRect: ref.current && ref.current.getBoundingClientRect(),
		} ),
		[ triggerAnimationOnChange ]
	);

	useLayoutEffect( () => {
		if ( ! previous || ! ref.current ) {
			return;
		}

		// We disable the animation if the user has a preference for reduced
		// motion.
		const disableAnimation = window.matchMedia(
			'(prefers-reduced-motion: reduce)'
		).matches;

		if ( disableAnimation ) {
			return;
		}

		const controller = new Controller( {
			x: 0,
			y: 0,
			width: prevRect.width,
			height: prevRect.height,
			config: {
				duration: ANIMATION_DURATION,
				easing: easings.easeInOutQuint,
			},
			onChange( { value } ) {
				if ( ! ref.current ) {
					return;
				}
				let { x, y, width, height } = value;
				x = Math.round( x );
				y = Math.round( y );
				width = Math.round( width );
				height = Math.round( height );
				const finishedMoving = x === 0 && y === 0;
				ref.current.style.transformOrigin = 'center center';
				ref.current.style.transform = finishedMoving
					? null // Set to `null` to explicitly remove the transform.
					: `translate3d(${ x }px,${ y }px,0)`;
				ref.current.style.width = finishedMoving
					? null
					: `${ width }px`;
				ref.current.style.height = finishedMoving
					? null
					: `${ height }px`;
			},
		} );

		ref.current.style.transform = undefined;
		const destination = ref.current.getBoundingClientRect();

		const x = Math.round( prevRect.left - destination.left );
		const y = Math.round( prevRect.top - destination.top );
		const width = destination.width;
		const height = destination.height;

		controller.start( {
			x: 0,
			y: 0,
			width,
			height,
			from: { x, y, width: prevRect.width, height: prevRect.height },
		} );

		return () => {
			controller.stop();
			controller.set( {
				x: 0,
				y: 0,
				width: prevRect.width,
				height: prevRect.height,
			} );
		};
	}, [ previous, prevRect ] );

	return ref;
}

export default useMovingAnimation;
