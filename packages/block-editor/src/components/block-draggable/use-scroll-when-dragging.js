/**
 * WordPress dependencies
 */
import { getScrollContainer } from '@wordpress/dom';
import { useCallback, useEffect, useRef } from '@wordpress/element';

const SCROLL_INACTIVE_DISTANCE_PX = 50;
const SCROLL_INTERVAL_MS = 25;
const PIXELS_PER_SECOND_PER_PERCENTAGE = 1000;
const VELOCITY_MULTIPLIER =
	PIXELS_PER_SECOND_PER_PERCENTAGE * ( SCROLL_INTERVAL_MS / 1000 );

/**
 * React hook that scrolls the scroll container when a block is being dragged.
 *
 * @return {Function[]} `startScrolling`, `scrollOnDragOver`, `stopScrolling`
 *                      functions to be called in `onDragStart`, `onDragOver`
 *                      and `onDragEnd` events respectively.
 */
export default function useScrollWhenDragging() {
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

	const startScrolling = useCallback( ( event ) => {
		dragStartY.current = event.clientY;

		// Find nearest parent(s) to scroll.
		scrollParentY.current = getScrollContainer( event.target );

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
	}, [] );

	const scrollOnDragOver = useCallback( ( event ) => {
		if ( ! scrollParentY.current ) {
			return;
		}
		const scrollParentHeight = scrollParentY.current.offsetHeight;
		const offsetDragStartPosition =
			dragStartY.current - scrollParentY.current.offsetTop;
		const offsetDragPosition =
			event.clientY - scrollParentY.current.offsetTop;

		if ( event.clientY > offsetDragStartPosition ) {
			// User is dragging downwards.
			const moveableDistance = Math.max(
				scrollParentHeight -
					offsetDragStartPosition -
					SCROLL_INACTIVE_DISTANCE_PX,
				0
			);
			const dragDistance = Math.max(
				offsetDragPosition -
					offsetDragStartPosition -
					SCROLL_INACTIVE_DISTANCE_PX,
				0
			);
			const distancePercentage = dragDistance / moveableDistance;
			velocityY.current = VELOCITY_MULTIPLIER * distancePercentage;
		} else if ( event.clientY < offsetDragStartPosition ) {
			// User is dragging upwards.
			const moveableDistance = Math.max(
				offsetDragStartPosition - SCROLL_INACTIVE_DISTANCE_PX,
				0
			);
			const dragDistance = Math.max(
				offsetDragStartPosition -
					offsetDragPosition -
					SCROLL_INACTIVE_DISTANCE_PX,
				0
			);
			const distancePercentage = dragDistance / moveableDistance;
			velocityY.current = -VELOCITY_MULTIPLIER * distancePercentage;
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
