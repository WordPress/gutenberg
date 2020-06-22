/**
 * External dependencies
 */
import scrollIntoView from 'dom-scroll-into-view';

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { getScrollContainer } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { getBlockDOMNode } from '../../utils/dom';

/**
 * Scrolls the multi block selection end into view if not in view already. This
 * is important to do after selection by keyboard.
 */
export default function MultiSelectScrollIntoView() {
	const selector = ( select ) => {
		const {
			getBlockSelectionEnd,
			hasMultiSelection,
			isMultiSelecting,
		} = select( 'core/block-editor' );

		return {
			selectionEnd: getBlockSelectionEnd(),
			isMultiSelection: hasMultiSelection(),
			isMultiSelecting: isMultiSelecting(),
		};
	};
	const { isMultiSelection, selectionEnd, isMultiSelecting } = useSelect(
		selector,
		[]
	);

	useEffect( () => {
		if ( ! selectionEnd || isMultiSelecting || ! isMultiSelection ) {
			return;
		}

		const extentNode = getBlockDOMNode( selectionEnd );

		if ( ! extentNode ) {
			return;
		}

		const scrollContainer = getScrollContainer( extentNode );

		// If there's no scroll container, it follows that there's no scrollbar
		// and thus there's no need to try to scroll into view.
		if ( ! scrollContainer ) {
			return;
		}

		scrollIntoView( extentNode, scrollContainer, {
			onlyScrollIfNeeded: true,
		} );
	}, [ isMultiSelection, selectionEnd, isMultiSelecting ] );

	return null;
}
