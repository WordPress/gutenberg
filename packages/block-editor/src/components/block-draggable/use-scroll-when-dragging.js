/**
 * WordPress dependencies
 */
import { getScrollContainer } from '@wordpress/dom';
import { useCallback, useEffect, useRef } from '@wordpress/element';

const SCROLL_INACTIVE_DISTANCE_PX = 50;
const SCROLL_INTERVAL_MS = 25;
const PIXELS_PER_SECOND_PER_DISTANCE = 5;
const VELOCITY_MULTIPLIER =
	PIXELS_PER_SECOND_PER_DISTANCE * ( SCROLL_INTERVAL_MS / 1000 );

/**
 * React hook that scrolls the scroll container when a block is being dragged.
 *
 * @param {string} blockElementId The `id` attribute of the block element.
 *
 * @return {Function[]} `startScrolling`, `scrollOnDragOver`, `stopScrolling`
 *                      functions to be called in `onDragStart`, `onDragOver`
 *                      and `onDragEnd` events respectively.
 */
export default function useScrollWhenDragging( blockElementId ) {
	const dragStartY = useRef( null );
	const velocityY = useRef( null );
	const scrollParentY = useRef( null );
	const scrollEditorInterval = useRef( null );

	// Clear interval when unmounting.
	useEffect(
		() => () => {
			if ( scrollEditorInterval.current ) {
				clearInterval( scrollEditorInterval.current );
				scrollEditorInterval.current = null;
			}
		},
		[]
	);

	const startScrolling = useCallback(
		( event ) => {
			dragStartY.current = event.clientY;

			// Find nearest parent(s) to scroll.
			scrollParentY.current = getScrollContainer(
				document.getElementById( blockElementId )
			);

			scrollEditorInterval.current = setInterval( () => {
				if ( scrollParentY.current && velocityY.current ) {
					const newTop =
						scrollParentY.current.scrollTop + velocityY.current;

					// Setting `behavior: 'smooth'` as a scroll property seems to hurt performance.
					// Better to use a small scroll interval.
					scrollParentY.current.scroll( {
						top: newTop,
					} );
				}
			}, SCROLL_INTERVAL_MS );
		},
		[ blockElementId ]
	);

	const scrollOnDragOver = useCallback( ( event ) => {
		const distanceY = event.clientY - dragStartY.current;
		if ( distanceY > SCROLL_INACTIVE_DISTANCE_PX ) {
			velocityY.current =
				VELOCITY_MULTIPLIER *
				( distanceY - SCROLL_INACTIVE_DISTANCE_PX );
		} else if ( distanceY < -SCROLL_INACTIVE_DISTANCE_PX ) {
			velocityY.current =
				VELOCITY_MULTIPLIER *
				( distanceY + SCROLL_INACTIVE_DISTANCE_PX );
		} else {
			velocityY.current = 0;
		}
	}, [] );

	const stopScrolling = () => {
		dragStartY.current = null;
		scrollParentY.current = null;

		if ( scrollEditorInterval.current ) {
			clearInterval( scrollEditorInterval.current );
			scrollEditorInterval.current = null;
		}
	};

	return [ startScrolling, scrollOnDragOver, stopScrolling ];
}
