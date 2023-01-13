/**
 * WordPress dependencies
 */
import { getScrollContainer } from '@wordpress/dom';
import { useEffect } from '@wordpress/element';

export default function useListViewScrollIntoView( {
	firstSelectedBlockClientId,
	numBlocksSelected,
	selectedItemRef,
} ) {
	useEffect( () => {
		// Skip scrolling into view if more than one block is selected.
		// This is to avoid scrolling the view in a multi selection where the user
		// has intentionally selected multiple blocks within the list view,
		// but the initially selected block may be out of view.
		if (
			numBlocksSelected !== 1 ||
			! selectedItemRef?.current ||
			! selectedItemRef.current.scrollIntoView
		) {
			return;
		}

		const scrollContainer = getScrollContainer( selectedItemRef.current );
		const { ownerDocument } = selectedItemRef.current;
		const { defaultView } = ownerDocument;

		const windowScroll =
			scrollContainer === ownerDocument.body ||
			scrollContainer === ownerDocument.documentElement;

		// If the there is no scroll container, of if the scroll container is the window,
		// do not scroll into view, as the block is already in view.
		if ( windowScroll || ! scrollContainer ) {
			return;
		}

		const { top, height } = selectedItemRef.current.getBoundingClientRect();
		const topOfScrollContainer =
			scrollContainer.getBoundingClientRect().top;

		const { innerHeight } = defaultView;

		// If the selected block is not currently visible, scroll to it.
		if ( top < topOfScrollContainer || top + height > innerHeight ) {
			selectedItemRef.current.scrollIntoView();
		}
	}, [
		firstSelectedBlockClientId,
		numBlocksSelected,
		selectedItemRef?.current,
	] );
}
