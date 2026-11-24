import { useRefEffect } from '@wordpress/compose';

/**
 * Puts the caret back when iOS moves it out of a field right after focus
 * moved there from the wrapper, as the editing host. Moving focus soon after
 * a tap makes WebKit reset its text gestures, and UIKit then repeats the tap
 * at the top left corner of the page, moving the caret there. Focus stays in
 * the field, so only that repeat leaves the caret outside it.
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
			// TEMPORARY (debugging a flaky iOS test).
			( window as any ).__iosTestLog?.(
				'restore:save',
				'saved=' + !! caret
			);
		}

		// A new press or key may move the caret anywhere.
		function forget() {
			// TEMPORARY (debugging a flaky iOS test).
			if ( caret ) {
				( window as any ).__iosTestLog?.( 'restore:forget' );
			}
			caret = undefined;
		}

		function onSelectionChange() {
			const { activeElement } = ownerDocument;
			if (
				caret &&
				selection.anchorNode &&
				! activeElement?.contains( selection.anchorNode )
			) {
				// TEMPORARY (debugging a flaky iOS test).
				( window as any ).__iosTestLog?.( 'restore:before' );
				selection.removeAllRanges();
				selection.addRange( caret );
				( window as any ).__iosTestLog?.( 'restore:after' );
				caret = undefined;
			}
		}

		// The repeat can also clear the selection, leaving focus in the field.
		// Nothing else then puts the caret back, so a key would do nothing.
		function onKeyDown() {
			if (
				caret &&
				! selection.rangeCount &&
				ownerDocument.activeElement === field
			) {
				// TEMPORARY (debugging a flaky iOS test).
				( window as any ).__iosTestLog?.( 'restore:keydown' );
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
