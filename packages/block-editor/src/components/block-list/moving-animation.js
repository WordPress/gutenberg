/**
 * External dependencies
 */
import { useSpring, interpolate } from 'react-spring/web.cjs';

/**
 * WordPress dependencies
 */
import { useState, useLayoutEffect, useReducer } from '@wordpress/element';
import { useReducedMotion } from '@wordpress/compose';

/**
 * Simple reducer used to increment a counter.
 *
 * @param {number} state  Previous counter value.
 * @return {number} New state value.
 */
const counterReducer = ( state ) => state + 1;

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
 * @param {Object}  ref                      Reference to the element to animate.
 * @param {boolean} isSelected               Whether it's the current block or not.
 * @param {boolean} enableAnimation          Enable/Disable animation.
 * @param {*}       triggerAnimationOnChange Variable used to trigger the animation if it changes.
 *
 * @return {Object} Style object.
 */
function useMovingAnimation( ref, isSelected, enableAnimation, triggerAnimationOnChange ) {
	const prefersReducedMotion = useReducedMotion() || ! enableAnimation;
	const [ triggeredAnimation, triggerAnimation ] = useReducer( counterReducer, 0 );
	const [ finishedAnimation, endAnimation ] = useReducer( counterReducer, 0 );
	const [ transform, setTransform ] = useState( { x: 0, y: 0 } );

	const previous = ref.current ? ref.current.getBoundingClientRect() : null;

	useLayoutEffect( () => {
		if ( triggeredAnimation ) {
			endAnimation();
		}
	}, [ triggeredAnimation ] );
	useLayoutEffect( () => {
		if ( prefersReducedMotion ) {
			return;
		}
		ref.current.style.transform = 'none';
		const destination = ref.current.getBoundingClientRect();
		const newTransform = {
			x: previous ? previous.left - destination.left : 0,
			y: previous ? previous.top - destination.top : 0,
		};
		ref.current.style.transform = newTransform.x === 0 && newTransform.y === 0 ?
			undefined :
			`translate3d(${ newTransform.x }px,${ newTransform.y }px,0)`;
		triggerAnimation();
		setTransform( newTransform );
	}, [ triggerAnimationOnChange ] );
	const animationProps = useSpring( {
		from: transform,
		to: {
			x: 0,
			y: 0,
		},
		reset: triggeredAnimation !== finishedAnimation,
		config: { mass: 5, tension: 2000, friction: 200 },
		immediate: prefersReducedMotion,
	} );

	return {
		transformOrigin: 'center',
		transform: interpolate(
			[
				animationProps.x,
				animationProps.y,
			],
			( x, y ) => x === 0 && y === 0 ? undefined : `translate3d(${ x }px,${ y }px,0)`
		),
		zIndex: interpolate(
			[
				animationProps.x,
				animationProps.y,
			],
			( x, y ) => ! isSelected || ( x === 0 && y === 0 ) ? undefined : `1`
		),
	};
}

export default useMovingAnimation;
