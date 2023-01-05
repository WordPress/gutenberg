/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

export default function useListViewScrollIntoView( {
	firstSelectedBlockClientId,
	numBlocksSelected,
	selectedItemRef,
} ) {
	useEffect( () => {
		if (
			numBlocksSelected !== 1 ||
			! selectedItemRef?.current ||
			! selectedItemRef.current.scrollIntoView
		) {
			return;
		}

		const { top, height } = selectedItemRef.current.getBoundingClientRect();
		const { innerHeight } = window;

		// If the selected block is not visible, scroll to it.
		// The hard-coded value of 110 corresponds to the position at the top of the scrollable area.
		if ( top < 110 || top + height > innerHeight ) {
			selectedItemRef.current.scrollIntoView();
		}
	}, [
		firstSelectedBlockClientId,
		numBlocksSelected,
		selectedItemRef?.current,
	] );
}
