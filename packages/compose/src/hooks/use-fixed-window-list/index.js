/**
 * External dependencies
 */
import { throttle } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState, useLayoutEffect } from '@wordpress/element';
import { getScrollContainer } from '@wordpress/dom';

const DEFAULT_WINDOW_OVERSCAN = 1;
const DEFAULT_INIT_WINDOW_SIZE = 30;

/**
 * @typedef {Object} WPFixedWindowList
 *
 * @property {number}                  maxRendered  Maximum number of items that may be rendered in the window
 * @property {number}                  start        Start index of the window
 * @property {number}                  end          End index of the window
 * @property {(index:number)=>boolean} itemInView   Returns true if item is in the window
 * @property {number}                  startPadding Padding in px to add before the start item
 * @property {number}                  endPadding   Padding in px to add after the end item
 */

/**
 * @typedef {Object} WPFixedWindowListOptions
 *
 * @property {number}  [windowOverscan] Renders windowOverscan number of items before and after the calculated visible window.
 * @property {boolean} [useWindowing]   When false avoids calculating the window size
 * @property {number}  [initWindowSize] Initial window size to use on first render before we can calculate the window size.
 */

/**
 *
 * @param {import('react').RefObject<HTMLElement>} elementRef Used to find the closest scroll container that contains element.
 * @param { number }                               itemHeight Fixed item height in pixels
 * @param { number }                               totalItems Total items in list
 * @param { WPFixedWindowListOptions }             [options]  Options object
 * @return {[ WPFixedWindowList, setFixedListWindow:(nextWindow:WPFixedWindowList)=>void]} Array with the fixed window list and setter
 */
export default function useFixedWindowList(
	elementRef,
	itemHeight,
	totalItems,
	options
) {
	const windowOverscan = options?.windowOverscan ?? DEFAULT_WINDOW_OVERSCAN;
	const initWindowSize = options?.initWindowSize ?? DEFAULT_INIT_WINDOW_SIZE;
	const useWindowing = options?.useWindowing ?? true;

	const [ fixedListWindow, setFixedListWindow ] = useState( {
		maxRendered: initWindowSize,
		start: 0,
		end: initWindowSize,
		itemInView: ( /** @type {number} */ index ) => {
			return index >= 0 && index <= initWindowSize;
		},
		startPadding: 0,
		endPadding: 0,
	} );

	useLayoutEffect( () => {
		if ( ! useWindowing ) {
			return;
		}
		const scrollContainer = getScrollContainer( elementRef.current );
		const measureWindow = () => {
			if ( ! scrollContainer ) {
				return;
			}
			const visibleItems = Math.ceil(
				scrollContainer.clientHeight / itemHeight
			);
			const start = Math.max(
				0,
				Math.floor( scrollContainer.scrollTop / itemHeight ) -
					windowOverscan
			);
			const end = Math.min(
				totalItems - 1,
				start + visibleItems + windowOverscan
			);
			setFixedListWindow( {
				maxRendered: visibleItems + windowOverscan * 2,
				start,
				end,
				itemInView: ( index ) => {
					return start <= index && index <= end;
				},
				startPadding: itemHeight * start,
				endPadding:
					totalItems > end
						? itemHeight * ( totalItems - end - 1 )
						: 0,
			} );
		};

		measureWindow();
		const throttleMeasureList = throttle( () => {
			measureWindow();
		}, 16 );
		scrollContainer?.addEventListener( 'scroll', throttleMeasureList );
		scrollContainer?.ownerDocument?.defaultView?.addEventListener(
			'resize',
			throttleMeasureList
		);
		return () => {
			scrollContainer?.removeEventListener(
				'scroll',
				throttleMeasureList
			);
			scrollContainer?.ownerDocument?.defaultView?.removeEventListener(
				'resize',
				throttleMeasureList
			);
		};
	}, [ totalItems, itemHeight, elementRef ] );

	return [ fixedListWindow, setFixedListWindow ];
}
