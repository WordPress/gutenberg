import { useRefEffect } from '@wordpress/compose';

/**
 * Puts the caret back when iOS moves it out of a field right after focus
 * moved there from the wrapper, as the editing host. Moving focus soon after
 * a tap makes WebKit reset its text gestures, and UIKit then repeats the tap
 * at the top left corner of the page, moving the caret there or clearing the
 * selection. Focus stays in the field, so only that repeat leaves the field
 * without the caret.
 */
export default function useRestoreTapCaret() {
	return useRefEffect< HTMLElement >( ( node ) => {
		const { ownerDocument } = node;
		// A mounted element's document has a window, with a selection.
		const selection = ownerDocument.defaultView!.getSelection()!;
		let caret: Range | undefined;
		let field: Node | undefined;

		function onFocusIn( event: FocusEvent ) {
			field = event.target as Node;
			caret =
				event.relatedTarget === node &&
				selection.rangeCount &&
				field.contains( selection.anchorNode )
					? selection.getRangeAt( 0 ).cloneRange()
					: undefined;
		}

		// A new press or key may move the caret anywhere.
		function forget() {
			caret = undefined;
		}

		function onSelectionChange() {
			if (
				caret &&
				ownerDocument.activeElement === field &&
				! field.contains( selection.anchorNode )
			) {
				selection.removeAllRanges();
				selection.addRange( caret );
				caret = undefined;
			}
		}

		node.addEventListener( 'focusin', onFocusIn );
		ownerDocument.addEventListener( 'pointerdown', forget, true );
		ownerDocument.addEventListener( 'keydown', forget, true );
		ownerDocument.addEventListener( 'selectionchange', onSelectionChange );
		return () => {
			node.removeEventListener( 'focusin', onFocusIn );
			ownerDocument.removeEventListener( 'pointerdown', forget, true );
			ownerDocument.removeEventListener( 'keydown', forget, true );
			ownerDocument.removeEventListener(
				'selectionchange',
				onSelectionChange
			);
		};
	}, [] );
}
