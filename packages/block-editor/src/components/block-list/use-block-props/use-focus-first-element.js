import { useEffect, useRef } from '@wordpress/element';
import {
	focus,
	isFormElement,
	isTextField,
	placeCaretAtHorizontalEdge,
} from '@wordpress/dom';
import { useSelect, useDispatch } from '@wordpress/data';
import { RichTextData } from '@wordpress/rich-text';
import { isInsideRootBlock } from '../../../utils/dom';
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
	const {
		isBlockSelected,
		isMultiSelecting,
		isZoomOut,
		getSelectionStart,
		getBlockAttributes,
	} = unlock( useSelect( blockEditorStore ) );
	const { selectionChange } = useDispatch( blockEditorStore );

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

		// While the canvas has focus, select the rich text field in the
		// store and let it place its caret. Focusing it here would move
		// focus off an editing host and back, which resets the iOS
		// keyboard's capitalization.
		const attributeKey = target.dataset.wpBlockAttributeKey;
		if ( attributeKey && ownerDocument.hasFocus() ) {
			const selectionStart = getSelectionStart();
			if (
				selectionStart.clientId === clientId &&
				selectionStart.attributeKey
			) {
				return;
			}
			const value = getBlockAttributes( clientId )?.[ attributeKey ];
			let offset = 0;
			if ( isReverse ) {
				offset =
					value instanceof RichTextData
						? value.length
						: RichTextData.fromHTMLString( value ?? '' ).length;
			}
			selectionChange( clientId, attributeKey, offset, offset );
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
	}, [ initialPosition, clientId, selectionChange ] );

	return ref;
}
