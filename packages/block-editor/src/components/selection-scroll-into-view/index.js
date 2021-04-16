/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { getScrollContainer } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { getBlockDOMNode } from '../../utils/dom';
import { store as blockEditorStore } from '../../store';

/**
 * Scrolls the selected block or extent of a multi-block selection into view if
 * it is not in view at all. In particular this is for:
 *
 * - Multi-selection by keyboard to keep the selection extent in view.
 * - Inserting a block from the global inserter (which does not focus the block,
 *   so scroll-on-focus browser behaviour does not kick in).
 *
 * @param {import('@wordpress/element').RefObject} ref
 */
export function useScrollSelectionIntoView( ref ) {
	// Although selectionRootClientId isn't used directly in calculating
	// whether scrolling should occur, it is used as a dependency of the
	// effect to take into account situations where a block might be moved
	// to a different parent. In this situation, the selectionEnd clientId
	// remains the same, so the rootClientId is used to trigger the effect.
	const { selectionRootClientId, selectionEnd } = useSelect( ( select ) => {
		const selectors = select( blockEditorStore );
		// In case of a multi-selection, scroll to the selection extent rather
		// than the anchor.
		const selectionEndClientId = selectors.getBlockSelectionEnd();
		return {
			selectionEnd: selectionEndClientId,
			selectionRootClientId: selectors.getBlockRootClientId(
				selectionEndClientId
			),
		};
	}, [] );

	useEffect( () => {
		if ( ! selectionEnd ) {
			return;
		}

		const { ownerDocument } = ref.current;
		const extentNode = getBlockDOMNode( selectionEnd, ownerDocument );

		if ( ! extentNode ) {
			return;
		}

		const scrollContainer = getScrollContainer( extentNode );

		// If there's no scroll container, it follows that there's no scrollbar
		// and thus there's no need to try to scroll into view.
		if ( ! scrollContainer ) {
			return;
		}

		const scrollContainerRect = scrollContainer.getBoundingClientRect();
		const targetRect = extentNode.getBoundingClientRect();

		// Only scroll if the target is completely out of view. If the target is
		// partly in view, we shouldn't scroll the page as the selection might
		// have been made by the user and scrolling would be disorientating.
		if (
			targetRect.bottom > scrollContainerRect.top &&
			targetRect.top < scrollContainerRect.bottom
		) {
			return;
		}

		extentNode.scrollIntoView();
	}, [ selectionRootClientId, selectionEnd ] );
}

/**
 * Scrolls the multi block selection end into view if not in view already. This
 * is important to do after selection by keyboard.
 */
export function MultiSelectScrollIntoView() {
	const ref = useRef();
	useScrollSelectionIntoView( ref );
	return <div ref={ ref } />;
}
