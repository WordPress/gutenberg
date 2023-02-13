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
	const numBlocksSelected = selectedClientIds?.length;

	useLayoutEffect( () => {
		// Skip scrolling into view if more than one block is selected.
		// This is to avoid scrolling the view in a multi selection where the user
		// has intentionally selected multiple blocks within the list view,
		// but the initially selected block may be out of view.
		if (
			! isSelected ||
			numBlocksSelected !== 1 ||
			! rowItemRef.current ||
			! rowItemRef.current.scrollIntoView
		) {
			return;
		}

		const scrollContainer = getScrollContainer( rowItemRef.current );
		const { ownerDocument } = rowItemRef.current;
		const { defaultView } = ownerDocument;

		const windowScroll =
			scrollContainer === ownerDocument.body ||
			scrollContainer === ownerDocument.documentElement;

		// If the there is no scroll container, of if the scroll container is the window,
		// do not scroll into view, as the block is already in view.
		if ( windowScroll || ! scrollContainer ) {
			return;
		}

		const { top, height } = rowItemRef.current.getBoundingClientRect();
		const topOfScrollContainer =
			scrollContainer.getBoundingClientRect().top;

		const { innerHeight } = defaultView;

		// If the selected block is not currently visible, scroll to it.
		if ( top < topOfScrollContainer || top + height > innerHeight ) {
			rowItemRef.current.scrollIntoView();
		}
	}, [ isSelected, numBlocksSelected ] );
}
