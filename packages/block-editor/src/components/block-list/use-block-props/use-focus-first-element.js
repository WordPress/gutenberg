import { useEffect, useRef } from '@wordpress/element';
import {
	focus,
	isFormElement,
	isTextField,
	placeCaretAtHorizontalEdge,
} from '@wordpress/dom';
import { useSelect } from '@wordpress/data';
import { focusSelectedField, isInsideRootBlock } from '../../../utils/dom';
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

/** @typedef {import('@wordpress/element').RefObject} RefObject */

/**
 * Transitions focus to the block or inner tabbable when the block becomes
 * selected and an initial position is set.
 *
 * @param {string} clientId Block client ID.
 *
 * @return {RefObject} React ref with the block element.
 */
export function useFocusFirstElement( { clientId, initialPosition } ) {
	const ref = useRef();
	const { isBlockSelected, isMultiSelecting, isZoomOut, getSelectionStart } =
		unlock( useSelect( blockEditorStore ) );

	useEffect( () => {
		// Check if the block is still selected at the time this effect runs.
		if (
			! isBlockSelected( clientId ) ||
			isMultiSelecting() ||
			isZoomOut()
		) {
			return;
		}

		if ( initialPosition === undefined || initialPosition === null ) {
			return;
		}

		if ( ! ref.current ) {
			return;
		}

		const { ownerDocument } = ref.current;

		// Do not focus the block if it already contains the active element.
		if ( isInsideRootBlock( ref.current, ownerDocument.activeElement ) ) {
			return;
		}

		if ( initialPosition === true ) {
			ref.current.focus();
			return;
		}

		// When the selection names a field and an offset in this block, the
		// field's rich text places the caret. Only move focus to the field,
		// which does not take focus by itself.
		const selectionStart = getSelectionStart();

		if (
			selectionStart.clientId === clientId &&
			selectionStart.offset !== undefined
		) {
			focusSelectedField( ownerDocument, selectionStart );
			return;
		}

		// Find all tabbables within node.
		const textInputs = focus.tabbable
			.find( ref.current )
			.filter( ( node ) => isTextField( node ) );

		// If reversed (e.g. merge via backspace), use the last in the set of
		// tabbables.
		const isReverse = -1 === initialPosition;
		const target =
			textInputs[ isReverse ? textInputs.length - 1 : 0 ] || ref.current;

		if ( ! isInsideRootBlock( ref.current, target ) ) {
			ref.current.focus();
			return;
		}

		// Check to see if element is focussable before a generic caret insert.
		if ( ! ref.current.getAttribute( 'contenteditable' ) ) {
			const focusElement = focus.tabbable.findNext( ref.current );
			// Make sure focusElement is valid, contained in the same block, and a form field.
			if (
				focusElement &&
				isInsideRootBlock( ref.current, focusElement ) &&
				isFormElement( focusElement )
			) {
				focusElement.focus();
				return;
			}
		}
		// Do not place a caret when the target already contains one:
		// while a focused editing host contains the target (the block
		// supports `editableRoot`), the caret can be inside it without the
		// target holding focus. A leftover caret yields to an explicitly
		// requested edge position (initialPosition -1).
		const { activeElement } = ownerDocument;
		const selection = ownerDocument.defaultView.getSelection();
		const hasCaret =
			activeElement?.isContentEditable &&
			activeElement.contains( target ) &&
			!! selection.anchorNode &&
			target.contains( selection.anchorNode );

		if ( ! ( hasCaret && initialPosition === 0 ) ) {
			placeCaretAtHorizontalEdge( target, isReverse );
		}
	}, [ initialPosition, clientId ] );

	return ref;
}
