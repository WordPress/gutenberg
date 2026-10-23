import { Controller } from '@react-spring/web';
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
 * Only animates on reorder of same items.
 * Cancels running animations when the set of items changes (e.g. an item is added or removed).
 *
 * @param index    Position of the element in the list; the animation runs when it changes.
 * @param itemsKey Identifies the set of items in the list, regardless of order.
 */
export default function useMovingAnimation( index: number, itemsKey: string ) {
	const ref = useRef< HTMLDivElement >( null );
	const previousRef = useRef< { top: number; left: number } >( undefined );
	const previousItemsKeyRef = useRef( itemsKey );
	// Capture position before DOM updates (during render).
	// This runs synchronously during render, before layout effects.
	if ( ref.current ) {
		previousRef.current = getAbsolutePosition( ref.current );
	}
	useLayoutEffect( () => {
		const hasItemsChanged = previousItemsKeyRef.current !== itemsKey;
		previousItemsKeyRef.current = itemsKey;
		const previous = previousRef.current;
		if ( ! previous || ! ref.current ) {
			return;
		}
		if ( hasItemsChanged ) {
			ref.current.style.transform = '';
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
	}, [ index, itemsKey ] );
	return ref;
}
