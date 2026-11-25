import { useRefEffect } from '@wordpress/compose';

/**
 * Puts the caret back when iOS moves it out of a field right after focus
 * moved there from the wrapper, as the editing host. Moving focus soon after
 * a tap makes WebKit reset its text gestures, and UIKit then repeats the tap
 * at the top left corner of the page, moving the caret there or clearing the
 * selection. Focus stays in the field, so only that repeat leaves the caret
 * outside it, or leaves no caret at all.
 */
export default function useRestoreTapCaret() {
	return useRefEffect< HTMLElement >( ( node ) => {
		const { ownerDocument } = node;
		// A mounted element's document has a window, with a selection.
		const selection = ownerDocument.defaultView!.getSelection()!;
		let caret: Range | undefined;
		let field: Node | undefined;

		function onFocusIn( event: FocusEvent ) {
			caret =
				event.relatedTarget === node &&
				selection.rangeCount &&
				( event.target as Node ).contains( selection.anchorNode )
					? selection.getRangeAt( 0 ).cloneRange()
					: undefined;
			field = caret && ( event.target as Node );
		}

		// A new press or key may move the caret anywhere.
		function forget() {
			caret = undefined;
		}

		function onSelectionChange() {
			const { activeElement } = ownerDocument;
			if (
				caret &&
				selection.anchorNode &&
				! activeElement?.contains( selection.anchorNode )
			) {
				selection.removeAllRanges();
				selection.addRange( caret );
				caret = undefined;
			}
		}

		// When the repeat clears the selection instead, the next key would do
		// nothing. Restoring the caret only then, and not as soon as the
		// selection is cleared, leaves alone the block editor's own clearing of
		// it, such as when a whole block is selected.
		function onKeyDown() {
			if (
				caret &&
				! selection.rangeCount &&
				ownerDocument.activeElement === field
			) {
				selection.addRange( caret );
			}
			forget();
		}

		node.addEventListener( 'focusin', onFocusIn );
		ownerDocument.addEventListener( 'pointerdown', forget, true );
		ownerDocument.addEventListener( 'keydown', onKeyDown, true );
		ownerDocument.addEventListener( 'selectionchange', onSelectionChange );
		return () => {
			node.removeEventListener( 'focusin', onFocusIn );
			ownerDocument.removeEventListener( 'pointerdown', forget, true );
			ownerDocument.removeEventListener( 'keydown', onKeyDown, true );
			ownerDocument.removeEventListener(
				'selectionchange',
				onSelectionChange
			);
		};
	}, [] );
}
