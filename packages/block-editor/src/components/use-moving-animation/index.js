/**
 * External dependencies
 */
import { Controller, SpringValue } from '@react-spring/web';

/**
 * WordPress dependencies
 */
import { useState, useLayoutEffect, useMemo, useRef } from '@wordpress/element';
import { useReducedMotion } from '@wordpress/compose';
import { getScrollContainer } from '@wordpress/dom';

const getAbsolutePosition = ( element ) => {
	return {
		top: element.offsetTop,
		left: element.offsetLeft,
	};
};

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
	const previous = useMemo(
		() => ( ref.current ? getAbsolutePosition( ref.current ) : null ),
		[ triggerAnimationOnChange ]
	);

	// Calculate the previous position of the block relative to the viewport and
	// return a function to maintain that position by scrolling.
	const preserveScrollPosition = useMemo( () => {
		if ( ! adjustScrolling || ! ref.current ) {
			return () => {};
		}

		const scrollContainer = getScrollContainer( ref.current );

		if ( ! scrollContainer ) {
			return () => {};
		}

		const prevRect = ref.current.getBoundingClientRect();
		return () => {
			const blockRect = ref.current.getBoundingClientRect();
			const diff = blockRect.top - prevRect.top;

			if ( diff ) {
				scrollContainer.scrollTop += diff;
			}
		};
	}, [ triggerAnimationOnChange, adjustScrolling ] );

	// Initialize SpringValue and Controller
	const [ controller, setController ] = useState( null );

	useLayoutEffect( () => {
		const springConfig = { mass: 5, tension: 2000, friction: 200 };
		function onChange( { value } ) {
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
			ref.current.style.zIndex = isSelected ? '1' : '';

			preserveScrollPosition();
		}
		setController(
			new Controller( {
				x: new SpringValue( 0, springConfig ),
				y: new SpringValue( 0, springConfig ),
				onChange,
			} )
		);
	}, [ isSelected, preserveScrollPosition ] );

	useLayoutEffect( () => {
		if ( ! previous ) {
			return;
		}

		if ( prefersReducedMotion ) {
			// If the animation is disabled and the scroll needs to be adjusted,
			// just move directly to the final scroll position.
			preserveScrollPosition();

			return;
		}

		ref.current.style.transform = undefined;
		const destination = getAbsolutePosition( ref.current );

		const x = Math.round( previous.left - destination.left );
		const y = Math.round( previous.top - destination.top );

		// ref.current.style.transformOrigin = 'center center';
		// ref.current.style.transform = `translate3d(${ x }px,${ y }px,0)`;

		controller.start( { x: 0, y: 0, from: { x, y } } ).then( () => {} );

		// controller.update( { x, y } );
		// controller.start();
	}, [ triggerAnimationOnChange, controller ] );

	return ref;
}

export default useMovingAnimation;
