import { useRefEffect } from '@wordpress/compose';
import { getScrollContainer } from '@wordpress/dom';
import { flushSync, useRef, useState } from '@wordpress/element';
import { BLOCK_LIST_ITEM_HEIGHT } from './utils';
import type { FixedListWindow } from './types';

// Every window change re-renders the whole tree, so the window only moves once
// fewer than the minimum rows are left past the viewport, and then moves far
// enough for the next stretch of scrolling.
const MIN_BUFFER_ROWS = 10;
const MAX_BUFFER_ROWS = 40;

function getVisibleRows( list: HTMLElement, scrollContainer: Element ) {
	const { documentElement } = list.ownerDocument;
	const { top, bottom } =
		scrollContainer === documentElement
			? { top: 0, bottom: documentElement.clientHeight }
			: scrollContainer.getBoundingClientRect();
	const listTop = list.getBoundingClientRect().top;

	return {
		first: Math.max(
			0,
			Math.floor( ( top - listTop ) / BLOCK_LIST_ITEM_HEIGHT )
		),
		last: Math.max(
			0,
			Math.ceil( ( bottom - listTop ) / BLOCK_LIST_ITEM_HEIGHT )
		),
	};
}

function coversRows(
	{ start, end }: FixedListWindow,
	first: number,
	last: number,
	spareRows: number
) {
	return (
		( start === 0 || first - start >= spareRows ) && end - last >= spareRows
	);
}

/**
 * Tracks which rows of the list view should be rendered.
 *
 * @return The ref for the list element, and the window of rows to render.
 */
export default function useListViewWindow() {
	// The list can't be measured without forcing a layout while it opens, but
	// it never shows more rows than fit in the browser window.
	const [ fixedListWindow, setFixedListWindow ] = useState< FixedListWindow >(
		() => ( {
			start: 0,
			end: Math.ceil( window.innerHeight / BLOCK_LIST_ITEM_HEIGHT ),
		} )
	);
	// The listeners below have to know which rows are rendered to tell
	// whether a row in view is missing.
	const listWindowRef = useRef( fixedListWindow );

	const ref = useRefEffect( ( list: HTMLElement ) => {
		const { ownerDocument } = list;
		const defaultView = ownerDocument.defaultView as Window;
		const updateWindow = ( spareRows: number ) => {
			const scrollContainer =
				getScrollContainer( list ) ?? ownerDocument.documentElement;
			const { first, last } = getVisibleRows( list, scrollContainer );
			const listWindow = listWindowRef.current;
			if ( coversRows( listWindow, first, last, spareRows ) ) {
				return;
			}

			// A row can only be unmounted when the window moves, so this is
			// the one moment the focused row has to be known.
			const focusedRow =
				ownerDocument.activeElement?.closest< HTMLElement >(
					'[data-block]'
				);
			const nextWindow = {
				start: Math.max( 0, first - MAX_BUFFER_ROWS ),
				end: last + MAX_BUFFER_ROWS,
				focusedClientId:
					focusedRow && list.contains( focusedRow )
						? focusedRow.dataset.block
						: undefined,
			};
			listWindowRef.current = nextWindow;

			// Scroll events run before paint, so rows that are already in view
			// have to be committed here to show up in this frame.
			if ( coversRows( listWindow, first, last, 0 ) ) {
				setFixedListWindow( nextWindow );
			} else {
				flushSync( () => setFixedListWindow( nextWindow ) );
			}
		};

		const fillViewport = () => updateWindow( 0 );
		const resizeObserver = new ResizeObserver( fillViewport );

		// Scroll events don't bubble, but capturing them here covers whichever
		// ancestor ends up scrolling the list.
		const onScroll = ( event: Event ) => {
			if ( ( event.target as Node ).contains( list ) ) {
				updateWindow( MIN_BUFFER_ROWS );
			}
		};

		ownerDocument.addEventListener( 'scroll', onScroll, {
			capture: true,
			passive: true,
		} );
		defaultView.addEventListener( 'resize', fillViewport );

		// Any ancestor can end up as the scroll container: a popover only
		// clips its content after the first layout, and a list starts to
		// overflow as it grows. The observer first reports after layout, so
		// the first measurement doesn't force one while the list opens.
		for (
			let node: Element | null = list;
			node;
			node = node.parentElement
		) {
			resizeObserver.observe( node );
		}

		return () => {
			resizeObserver.disconnect();
			defaultView.removeEventListener( 'resize', fillViewport );
			ownerDocument.removeEventListener( 'scroll', onScroll, {
				capture: true,
			} );
		};
	}, [] );

	return { ref, fixedListWindow };
}
