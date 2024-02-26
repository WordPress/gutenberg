/**
 * WordPress dependencies
 */
import { getScrollContainer } from '@wordpress/dom';
import { useLayoutEffect } from '@wordpress/element';

export default function useListViewScrollIntoView( {
	isSelected,
	selectedClientIds,
	rowItemRef,
} ) {
	const isSingleSelection = selectedClientIds.length === 1;

	useLayoutEffect( () => {
		// Skip scrolling into view if this particular block isn't selected,
		// or if more than one block is selected overall. This is to avoid
		// scrolling the view in a multi selection where the user has intentionally
		// selected multiple blocks within the list view, but the initially
		// selected block may be out of view.
		if ( ! isSelected || ! isSingleSelection || ! rowItemRef.current ) {
			return;
		}

		const scrollContainer = getScrollContainer( rowItemRef.current );
		const { ownerDocument } = rowItemRef.current;

		const windowScroll =
			scrollContainer === ownerDocument.body ||
			scrollContainer === ownerDocument.documentElement;

		// If the there is no scroll container, of if the scroll container is the window,
		// do not scroll into view, as the block is already in view.
		if ( windowScroll || ! scrollContainer ) {
			return;
		}

		const rowRect = rowItemRef.current.getBoundingClientRect();
		const scrollContainerRect = scrollContainer.getBoundingClientRect();

		// If the selected block is not currently visible, scroll to it.
		if (
			rowRect.top < scrollContainerRect.top ||
			rowRect.bottom > scrollContainerRect.bottom
		) {
			rowItemRef.current.scrollIntoView();
		}
	}, [ isSelected, isSingleSelection, rowItemRef ] );
}
