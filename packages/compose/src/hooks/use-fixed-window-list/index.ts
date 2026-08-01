/**
 * WordPress dependencies
 */
import { useState, useLayoutEffect, useRef } from '@wordpress/element';
import { getScrollContainer } from '@wordpress/dom';
import { PAGEUP, PAGEDOWN, HOME, END } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import useEvent from '../use-event';

const DEFAULT_INIT_WINDOW_SIZE = 30;

interface FixedWindowList {
	/** Items visible in the viewport, as of the last rendered window */
	visibleItems: number;
	/** Start index of the window */
	start: number;
	/** End index of the window */
	end: number;
	/** Returns true if item is in the window */
	itemInView: ( index: number ) => boolean;
}

interface FixedWindowListOptions {
	/** Renders windowOverscan number of items before and after the calculated visible window. */
	windowOverscan?: number;
	/** When false avoids calculating the window size */
	useWindowing?: boolean;
	/** Initial window size to use on first render before we can calculate the window size. */
	initWindowSize?: number;
	/** Used to recalculate the window size when the expanded state of a list changes. */
	expandedState?: any;
}

/**
 *
 * @param elementRef Used to find the closest scroll container that contains element.
 * @param itemHeight Fixed item height in pixels
 * @param totalItems Total items in list
 * @param [options]  Options object
 * @return Array with the fixed window list and setter
 */
export default function useFixedWindowList(
	elementRef: React.RefObject< HTMLElement >,
	itemHeight: number,
	totalItems: number,
	options?: FixedWindowListOptions
): [
	FixedWindowList,
	React.Dispatch< React.SetStateAction< FixedWindowList > >,
] {
	const {
		windowOverscan,
		useWindowing = true,
		initWindowSize = DEFAULT_INIT_WINDOW_SIZE,
		expandedState,
	} = options ?? {};

	const [ fixedListWindow, setFixedListWindow ] = useState< FixedWindowList >(
		{
			visibleItems: initWindowSize,
			start: 0,
			end: initWindowSize,
			itemInView: ( index: number ) => {
				return index >= 0 && index <= initWindowSize;
			},
		}
	);

	// Kept out of state so that measuring the list does not, on its own, force a
	// re-render. Only the rendered window does that.
	const visibleItemsRef = useRef( initWindowSize );

	// The measuring effect re-runs whenever the list changes, so the effect
	// running can't on its own tell the very first measurement from later ones.
	const isFirstMeasurementRef = useRef( true );

	// Stable identity, so the listeners below never have to be re-attached, and
	// reads the latest props on every call.
	const measureWindow = useEvent( ( initRender?: boolean ) => {
		const scrollContainer = getScrollContainer( elementRef.current );
		if ( ! scrollContainer ) {
			return;
		}
		const visibleItems = Math.ceil(
			scrollContainer.clientHeight / itemHeight
		);
		visibleItemsRef.current = visibleItems;
		const isFirstMeasurement = isFirstMeasurementRef.current;
		isFirstMeasurementRef.current = false;
		// Aim to keep opening list view fast, afterward we can optimize for scrolling.
		const overscan = initRender
			? visibleItems
			: windowOverscan ?? visibleItems;
		const firstViewableIndex = Math.floor(
			scrollContainer.scrollTop / itemHeight
		);
		const start = Math.max( 0, firstViewableIndex - overscan );
		const end = Math.min(
			totalItems - 1,
			firstViewableIndex + visibleItems + overscan
		);
		setFixedListWindow( ( lastWindow ) => {
			// Rendering the window is the expensive part, and for the items in
			// `lastWindow` it is already paid for. When the next window has
			// nothing to add, keep the current one: a window that only shrinks
			// drops nodes that are known to be needed again and forces another
			// style recalculation, with nothing new to show for it.
			if ( lastWindow.start <= start && lastWindow.end >= end ) {
				return lastWindow;
			}
			// The first window is rendered before the list can be measured, so
			// it is sized by `initWindowSize` rather than by the viewport, and
			// the measured window is normally wider than it by the overscan.
			// Nothing has painted yet though, so there is no scrolling for the
			// overscan to absorb: covering the visible items is enough, and
			// keeping that window saves a render pass while the list opens.
			if (
				isFirstMeasurement &&
				lastWindow.start <= firstViewableIndex &&
				lastWindow.end >= firstViewableIndex + visibleItems
			) {
				return lastWindow;
			}
			return {
				visibleItems,
				start,
				end,
				itemInView: ( index: number ) => {
					return start <= index && index <= end;
				},
			};
		} );
	} );

	const handleKeyDown = useEvent(
		( event: KeyboardEvent, scrollContainer: Element ) => {
			switch ( event.keyCode ) {
				case HOME: {
					return scrollContainer.scrollTo( { top: 0 } );
				}
				case END: {
					return scrollContainer.scrollTo( {
						top: totalItems * itemHeight,
					} );
				}
				case PAGEUP: {
					return scrollContainer.scrollTo( {
						top:
							scrollContainer.scrollTop -
							visibleItemsRef.current * itemHeight,
					} );
				}
				case PAGEDOWN: {
					return scrollContainer.scrollTo( {
						top:
							scrollContainer.scrollTop +
							visibleItemsRef.current * itemHeight,
					} );
				}
			}
		}
	);

	// Measure whenever something that the window is derived from changes.
	useLayoutEffect( () => {
		if ( ! useWindowing ) {
			return;
		}
		measureWindow( true );
	}, [
		useWindowing,
		measureWindow,
		itemHeight,
		totalItems,
		windowOverscan,
		expandedState,
	] );

	// Only ever attaches and detaches listeners. The deps are the things that
	// can change which element the scroll container is, or whether there is one
	// at all: a list that is too short to overflow has no scroll container to
	// attach to, and it grows into one by gaining items or by being expanded.
	useLayoutEffect( () => {
		if ( ! useWindowing ) {
			return;
		}
		const scrollContainer = getScrollContainer( elementRef.current );
		if ( ! scrollContainer ) {
			return;
		}
		const { defaultView } = scrollContainer.ownerDocument;
		// `scroll` and `resize` already fire at about the rendering rate, so
		// there is nothing to gain from debouncing them.
		const onMeasure = () => measureWindow();
		const onKeyDown = ( event: KeyboardEvent ) =>
			handleKeyDown( event, scrollContainer );

		scrollContainer.addEventListener( 'scroll', onMeasure );
		defaultView?.addEventListener( 'resize', onMeasure );
		defaultView?.addEventListener( 'keydown', onKeyDown );

		return () => {
			scrollContainer.removeEventListener( 'scroll', onMeasure );
			defaultView?.removeEventListener( 'resize', onMeasure );
			defaultView?.removeEventListener( 'keydown', onKeyDown );
		};
	}, [
		useWindowing,
		elementRef,
		itemHeight,
		totalItems,
		expandedState,
		measureWindow,
		handleKeyDown,
	] );

	return [ fixedListWindow, setFixedListWindow ];
}
