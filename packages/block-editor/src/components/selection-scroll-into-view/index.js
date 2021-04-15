/**
 * External dependencies
 */
import scrollIntoView from 'dom-scroll-into-view';

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

export function useScrollSelectionIntoView( ref ) {
	// Although selectionRootClientId isn't used directly in calculating
	// whether scrolling should occur, it is used as a dependency of the
	// effect to take into account situations where a block might be moved
	// to a different parent. In this situation, the selectionEnd clientId
	// remains the same, so the rootClientId is used to trigger the effect.
	const { selectionRootClientId, selectionEnd } = useSelect( ( select ) => {
		const selectors = select( blockEditorStore );
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

		scrollIntoView( extentNode, scrollContainer, {
			onlyScrollIfNeeded: true,
		} );
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
