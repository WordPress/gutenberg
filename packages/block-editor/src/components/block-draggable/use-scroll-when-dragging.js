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
	const dragStartYRef = useRef( null );
	const velocityYRef = useRef( null );
	const scrollParentYRef = useRef( null );
	const scrollEditorIntervalRef = useRef( null );

	// Clear interval when unmounting.
	useEffect(
		() => () => {
			if ( scrollEditorIntervalRef.current ) {
				clearInterval( scrollEditorIntervalRef.current );
				scrollEditorIntervalRef.current = null;
			}
		},
		[]
	);

	const startScrolling = useCallback( ( event ) => {
		dragStartYRef.current = event.clientY;

		// Find nearest parent(s) to scroll.
		scrollParentYRef.current = getScrollContainer( event.target );

		scrollEditorIntervalRef.current = setInterval( () => {
			if ( scrollParentYRef.current && velocityYRef.current ) {
				const newTop =
					scrollParentYRef.current.scrollTop + velocityYRef.current;

				// Setting `behavior: 'smooth'` as a scroll property seems to hurt performance.
				// Better to use a small scroll interval.
				scrollParentYRef.current.scroll( {
					top: newTop,
				} );
			}
		}, SCROLL_INTERVAL_MS );
	}, [] );

	const scrollOnDragOver = useCallback( ( event ) => {
		if ( ! scrollParentYRef.current ) {
			return;
		}
		const scrollParentHeight = scrollParentYRef.current.offsetHeight;
		const offsetDragStartPosition =
			dragStartYRef.current - scrollParentYRef.current.offsetTop;
		const offsetDragPosition =
			event.clientY - scrollParentYRef.current.offsetTop;

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
			const distancePercentage =
				moveableDistance === 0 || dragDistance === 0
					? 0
					: dragDistance / moveableDistance;
			velocityYRef.current = VELOCITY_MULTIPLIER * distancePercentage;
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
			const distancePercentage =
				moveableDistance === 0 || dragDistance === 0
					? 0
					: dragDistance / moveableDistance;
			velocityYRef.current = -VELOCITY_MULTIPLIER * distancePercentage;
		} else {
			velocityYRef.current = 0;
		}
	}, [] );

	const stopScrolling = () => {
		dragStartYRef.current = null;
		scrollParentYRef.current = null;

		if ( scrollEditorIntervalRef.current ) {
			clearInterval( scrollEditorIntervalRef.current );
			scrollEditorIntervalRef.current = null;
		}
	};

	return [ startScrolling, scrollOnDragOver, stopScrolling ];
}
