/**
 * WordPress dependencies
 */
import { getScrollContainer } from '@wordpress/dom';
import { useCallback, useEffect, useRef } from '@wordpress/element';

const BOUNDARY_ZONE_PERCENTAGE_SIZE = 0.33;
const SCROLL_INTERVAL_MS = 25;
const PIXELS_PER_SECOND_PER_PERCENTAGE = 1000;
const VELOCITY_MULTIPLIER =
	PIXELS_PER_SECOND_PER_PERCENTAGE * ( SCROLL_INTERVAL_MS / 1000 );

/**
 * React hook that scrolls the scroll container when a block is being dragged.
 *
 * @param {Element} dragElement The DOM element being dragged.
 *
 * @return {Function[]} `startScrolling`, `scrollOnDragOver`, `stopScrolling`
 *                      functions to be called in `onDragStart`, `onDragOver`
 *                      and `onDragEnd` events respectively.
 */
export default function useScrollWhenDragging( dragElement ) {
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
			scrollParentY.current = getScrollContainer( dragElement );

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
		[ dragElement ]
	);

	const scrollOnDragOver = useCallback( ( event ) => {
		const scrollParentHeight = scrollParentY.current.offsetHeight;
		const scrollParentBoundaryHeight =
			BOUNDARY_ZONE_PERCENTAGE_SIZE * scrollParentHeight;
		const offsetDragPosition =
			event.clientY - scrollParentY.current.offsetTop;

		if ( event.clientY > dragStartY.current ) {
			// User is dragging down.
			const scrollParentBoundaryTop =
				scrollParentHeight - scrollParentBoundaryHeight;
			const distanceIntoBoundary = Math.max(
				0,
				offsetDragPosition - scrollParentBoundaryTop
			);
			const distancePercentage =
				distanceIntoBoundary / scrollParentBoundaryHeight;
			velocityY.current = VELOCITY_MULTIPLIER * distancePercentage;
		} else if ( event.clientY < dragStartY.current ) {
			// User is dragging up.
			const distanceIntoBoundary = Math.max(
				0,
				scrollParentBoundaryHeight - offsetDragPosition
			);
			const distancePercentage =
				distanceIntoBoundary / scrollParentBoundaryHeight;
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
