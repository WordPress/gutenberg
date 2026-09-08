import { useEffect, useLayoutEffect, useRef } from '@wordpress/element';
import {
	focus,
	isFormElement,
	isTextField,
	placeCaretAtHorizontalEdge,
} from '@wordpress/dom';
import { useSelect } from '@wordpress/data';
import { getBlockClientId, isInsideRootBlock } from '../../../utils/dom';
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

	// The field of this block the store selection starts in, if any, and the
	// selection end, so a change of either runs the effect below.
	const { attributeKey, startOffset, endClientId, endOffset } = useSelect(
		( select ) => {
			const selectionStart =
				select( blockEditorStore ).getSelectionStart();
			const selectionEnd = select( blockEditorStore ).getSelectionEnd();
			return selectionStart.clientId === clientId
				? {
						attributeKey: selectionStart.attributeKey,
						startOffset: selectionStart.offset,
						endClientId: selectionEnd.clientId,
						endOffset: selectionEnd.offset,
				  }
				: {};
		},
		[ clientId ]
	);

	// Focus the field the store selection names when it does not hold focus.
	// A field selected by a split, a merge, a transform, undo, or a toolbar
	// action does not receive focus by itself: the rich text hook applies the
	// selection but does not manage focus.
	useLayoutEffect( () => {
		if ( ! attributeKey || ! ref.current ) {
			return;
		}

		// The block element itself can be the field, when the block spreads
		// its props onto its RichText. A field of an inner block is not this
		// block's, so match the client ID rather than the nearest block
		// element (the deprecated multiline RichText gives its lines the
		// block's props).
		const selector = `[data-wp-block-attribute-key="${ attributeKey }"]`;
		const field = ref.current.matches( selector )
			? ref.current
			: Array.from( ref.current.querySelectorAll( selector ) ).find(
					( element ) => getBlockClientId( element ) === clientId
			  );

		if ( ! field ) {
			return;
		}

		const { ownerDocument } = ref.current;
		const { activeElement } = ownerDocument;

		if (
			// The field has focus. When the document does not, the active
			// element is stale (a toolbar button in the top document).
			( ownerDocument.hasFocus() &&
				( activeElement === field ||
					field.contains( activeElement ) ) ) ||
			// A focused editing host contains the field (the block supports
			// `editableRoot`, or a multi selection is in progress).
			( activeElement?.contentEditable === 'true' &&
				activeElement.contains( field ) )
		) {
			return;
		}

		field.focus();
	}, [ attributeKey, startOffset, endClientId, endOffset ] );

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
		// target holding focus. Only a caret the rich text synchronized to
		// the store (offsets present) is deliberate; a leftover one yields
		// to an explicitly requested edge position (initialPosition -1).
		const { activeElement } = ownerDocument;
		const selection = ownerDocument.defaultView.getSelection();
		const { clientId: selectionClientId, offset } = getSelectionStart();
		const hasCaret =
			activeElement?.isContentEditable &&
			activeElement.contains( target ) &&
			!! selection.anchorNode &&
			target.contains( selection.anchorNode );
		const isDeliberate =
			initialPosition === 0 ||
			( offset !== undefined && selectionClientId === clientId );

		if ( ! ( hasCaret && isDeliberate ) ) {
			placeCaretAtHorizontalEdge( target, isReverse );
		}
	}, [ initialPosition, clientId ] );

	return ref;
}
