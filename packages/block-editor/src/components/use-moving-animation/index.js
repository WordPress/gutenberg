/**
 * External dependencies
 */
import { Controller } from '@react-spring/web';

/**
 * WordPress dependencies
 */
import { useLayoutEffect, useMemo, useRef } from '@wordpress/element';
import { useReducedMotion } from '@wordpress/compose';
import { getScrollContainer } from '@wordpress/dom';

function getAbsolutePosition( element ) {
	return {
		top: element.offsetTop,
		left: element.offsetLeft,
	};
}

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
 * @param {Object}  $1                          Options
 * @param {boolean} $1.isSelected               Whether it's the current block or not.
 * @param {boolean} $1.adjustScrolling          Adjust the scroll position to the current block.
 * @param {boolean} $1.enableAnimation          Enable/Disable animation.
 * @param {*}       $1.triggerAnimationOnChange Variable used to trigger the animation if it changes.
 */
function useMovingAnimation( {
	isSelected,
	adjustScrolling,
	enableAnimation,
	triggerAnimationOnChange,
} ) {
	const ref = useRef();
	const prefersReducedMotion = useReducedMotion() || ! enableAnimation;

	// We do not want to trigger the animation when a block gets selected, so we
	// use a ref to keep track of the value for use later in a callback.
	const isSelectedRef = useRef( isSelected );
	const adjustScrollingRef = useRef( adjustScrolling );

	useLayoutEffect( () => {
		isSelectedRef.current = isSelected;
		adjustScrollingRef.current = adjustScrolling;
	}, [ isSelected, adjustScrolling ] );

	// Whenever the trigger changes, we need to take a snapshot of the current
	// position of the block to use it as a destination point for the animation.
	const { previous, prevRect } = useMemo(
		() => ( {
			previous: ref.current && getAbsolutePosition( ref.current ),
			prevRect: ref.current && ref.current.getBoundingClientRect(),
		} ),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ triggerAnimationOnChange ]
	);

	useLayoutEffect( () => {
		if ( ! previous || ! ref.current ) {
			return;
		}

		const scrollContainer = getScrollContainer( ref.current );

		function preserveScrollPosition() {
			if ( adjustScrollingRef.current && prevRect ) {
				const blockRect = ref.current.getBoundingClientRect();
				const diff = blockRect.top - prevRect.top;

				if ( diff ) {
					scrollContainer.scrollTop += diff;
				}
			}
		}

		if ( prefersReducedMotion ) {
			// If the animation is disabled and the scroll needs to be adjusted,
			// just move directly to the final scroll position.
			preserveScrollPosition();
			return;
		}

		const controller = new Controller( {
			x: 0,
			y: 0,
			config: { mass: 5, tension: 2000, friction: 200 },
			onChange( { value } ) {
				if ( ! ref.current ) {
					return;
				}
				let { x, y } = value;
				x = Math.round( x );
				y = Math.round( y );
				const finishedMoving = x === 0 && y === 0;
				ref.current.style.transformOrigin = 'center center';
				ref.current.style.transform = finishedMoving
					? null // Set to `null` to explicitly remove the transform.
					: `translate3d(${ x }px,${ y }px,0)`;
				ref.current.style.zIndex = isSelectedRef.current ? '1' : '';
				preserveScrollPosition();
			},
		} );

		ref.current.style.transform = undefined;
		const destination = getAbsolutePosition( ref.current );

		const x = Math.round( previous.left - destination.left );
		const y = Math.round( previous.top - destination.top );

		controller.start( { x: 0, y: 0, from: { x, y } } );

		return () => {
			controller.stop();
		};
	}, [ previous, prevRect, prefersReducedMotion ] );

	return ref;
}

export default useMovingAnimation;
