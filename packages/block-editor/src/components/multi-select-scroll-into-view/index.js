/**
 * External dependencies
 */
import scrollIntoView from 'dom-scroll-into-view';

/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { getBlockDOMNode } from '../../utils/dom';

export function useScrollMultiSelectionIntoView( ref ) {
	const selectionEnd = useSelect( ( select ) => {
		const {
			getBlockSelectionEnd,
			hasMultiSelection,
			isMultiSelecting,
		} = select( 'core/block-editor' );

		const blockSelectionEnd = getBlockSelectionEnd();

		if (
			! blockSelectionEnd ||
			isMultiSelecting() ||
			! hasMultiSelection()
		) {
			return;
		}

		return blockSelectionEnd;
	}, [] );

	useEffect( () => {
		if ( ! selectionEnd ) {
			return;
		}

		const { ownerDocument } = ref.current;
		const { defaultView } = ownerDocument;
		const extentNode = getBlockDOMNode( selectionEnd, ownerDocument );

		if ( ! extentNode ) {
			return;
		}

		scrollIntoView( extentNode, defaultView, {
			onlyScrollIfNeeded: true,
		} );
	}, [ selectionEnd ] );
}

/**
 * Scrolls the multi block selection end into view if not in view already. This
 * is important to do after selection by keyboard.
 */
export default function MultiSelectScrollIntoView() {
	const ref = useRef();
	useScrollMultiSelectionIntoView( ref );
	return <div ref={ ref } />;
}
