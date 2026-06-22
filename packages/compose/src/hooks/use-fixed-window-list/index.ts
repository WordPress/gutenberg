/**
 * WordPress dependencies
 */
import { useState, useLayoutEffect } from '@wordpress/element';
import { getScrollContainer } from '@wordpress/dom';
import { PAGEUP, PAGEDOWN, HOME, END } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { debounce } from '../../utils/debounce';

const DEFAULT_INIT_WINDOW_SIZE = 30;

interface FixedWindowList {
	/** Items visible in the current viewport */
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
	const initWindowSize = options?.initWindowSize ?? DEFAULT_INIT_WINDOW_SIZE;
	const useWindowing = options?.useWindowing ?? true;

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

	useLayoutEffect( () => {
		if ( ! useWindowing ) {
			return;
		}
		const scrollContainer = getScrollContainer( elementRef.current );
		/**
		 *  Measures and sets the window of items to render based on the scroll position
		 *
		 * @param {boolean} [initRender] Indicates if this is the initial render
		 * @return {void}
		 */
		const measureWindow = ( initRender?: boolean ) => {
			if ( ! scrollContainer ) {
				return;
			}
			const visibleItems = Math.ceil(
				scrollContainer.clientHeight / itemHeight
			);
			// Aim to keep opening list view fast, afterward we can optimize for scrolling.
			const windowOverscan = initRender
				? visibleItems
				: options?.windowOverscan ?? visibleItems;
			const firstViewableIndex = Math.floor(
				scrollContainer.scrollTop / itemHeight
			);
			const start = Math.max( 0, firstViewableIndex - windowOverscan );
			const end = Math.min(
				totalItems - 1,
				firstViewableIndex + visibleItems + windowOverscan
			);
			setFixedListWindow( ( lastWindow ) => {
				const nextWindow = {
					visibleItems,
					start,
					end,
					itemInView: ( index: number ) => {
						return start <= index && index <= end;
					},
				};
				if (
					lastWindow.start !== nextWindow.start ||
					lastWindow.end !== nextWindow.end ||
					lastWindow.visibleItems !== nextWindow.visibleItems
				) {
					return nextWindow;
				}
				return lastWindow;
			} );
		};

		measureWindow( true );
		const debounceMeasureList = debounce( () => {
			measureWindow();
		}, 16 );
		scrollContainer?.addEventListener( 'scroll', debounceMeasureList );
		scrollContainer?.ownerDocument?.defaultView?.addEventListener(
			'resize',
			debounceMeasureList
		);
		scrollContainer?.ownerDocument?.defaultView?.addEventListener(
			'resize',
			debounceMeasureList
		);

		return () => {
			scrollContainer?.removeEventListener(
				'scroll',
				debounceMeasureList
			);
			scrollContainer?.ownerDocument?.defaultView?.removeEventListener(
				'resize',
				debounceMeasureList
			);
		};
	}, [
		itemHeight,
		elementRef,
		totalItems,
		options?.expandedState,
		options?.windowOverscan,
		useWindowing,
	] );

	useLayoutEffect( () => {
		if ( ! useWindowing ) {
			return;
		}
		const scrollContainer = getScrollContainer( elementRef.current );
		const handleKeyDown = ( event: KeyboardEvent ) => {
			switch ( event.keyCode ) {
				case HOME: {
					return scrollContainer?.scrollTo( { top: 0 } );
				}
				case END: {
					return scrollContainer?.scrollTo( {
						top: totalItems * itemHeight,
					} );
				}
				case PAGEUP: {
					return scrollContainer?.scrollTo( {
						top:
							scrollContainer.scrollTop -
							fixedListWindow.visibleItems * itemHeight,
					} );
				}
				case PAGEDOWN: {
					return scrollContainer?.scrollTo( {
						top:
							scrollContainer.scrollTop +
							fixedListWindow.visibleItems * itemHeight,
					} );
				}
			}
		};
		scrollContainer?.ownerDocument?.defaultView?.addEventListener(
			'keydown',
			handleKeyDown
		);
		return () => {
			scrollContainer?.ownerDocument?.defaultView?.removeEventListener(
				'keydown',
				handleKeyDown
			);
		};
	}, [
		totalItems,
		itemHeight,
		elementRef,
		fixedListWindow.visibleItems,
		useWindowing,
		options?.expandedState,
	] );

	return [ fixedListWindow, setFixedListWindow ];
}
