/**
 * External dependencies
 */
import { Controller } from '@react-spring/web';

/**
 * WordPress dependencies
 */
import { useLayoutEffect, useRef } from '@wordpress/element';

function getAbsolutePosition( element: HTMLElement ) {
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
 *  - It takes a snapshot of the position of the element to use it
 *    as a destination point for the animation.
 *  - It restores the element to the previous position using a CSS transform
 *
 * @param triggerAnimationOnChange Variable used to trigger the animation if it changes.
 */
export default function useMovingAnimation(
	triggerAnimationOnChange: unknown
) {
	const ref = useRef< HTMLDivElement >( null );
	const previousRef = useRef< { top: number; left: number } | null >( null );
	// Capture position before DOM updates (during render).
	// This runs synchronously during render, before layout effects.
	if ( ref.current ) {
		previousRef.current = getAbsolutePosition( ref.current );
	}
	useLayoutEffect( () => {
		const previous = previousRef.current;
		if ( ! previous || ! ref.current ) {
			return;
		}
		if ( window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches ) {
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
				ref.current.style.transform = finishedMoving
					? ''
					: `translate3d(${ x }px,${ y }px,0)`;
			},
		} );
		ref.current.style.transform = '';
		const destination = getAbsolutePosition( ref.current );
		const x = Math.round( previous.left - destination.left );
		const y = Math.round( previous.top - destination.top );
		controller.start( { x: 0, y: 0, from: { x, y } } );
		return () => {
			controller.stop();
			controller.set( { x: 0, y: 0 } );
		};
		// triggerAnimationOnChange is intentionally the only dependency - we want to
		// animate when this value changes, capturing position during render phase.
	}, [ triggerAnimationOnChange ] );
	return ref;
}
