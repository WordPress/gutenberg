import { useRefEffect } from '@wordpress/compose';

/**
 * Puts the caret back when iOS moves it out of a field right after focus
 * moved there from the wrapper, as the editing host. Moving focus soon after
 * a tap makes WebKit reset its text gestures, and UIKit then repeats the tap
 * at the top left corner of the page, moving the caret there. Focus stays in
 * the field, so only that repeat leaves the caret outside it.
 */

// TEMP DEBUG: send events to a local log server.
const DBG_T0 = Date.now();
function dbg( type: string, doc: Document, extra: Record< string, unknown > = {} ) {
	const sel = doc.defaultView?.getSelection();
	const d = ( n: Node | null | undefined ) =>
		n
			? ( n.nodeType === 3 ? '#text:' + ( n.textContent || '' ).slice( 0, 12 ) : ( n as Element ).tagName + '.' + String( ( n as Element ).className || '' ).split( ' ' )[ 0 ] + ( ( n as HTMLElement ).isContentEditable ? '[ce]' : '' ) )
			: null;
	try {
		// The WordPress server's log, which CI uploads, records the query.
		window.fetch(
			window.location.origin +
				'/wp-includes/images/blank.gif?dbgcaret=' +
				encodeURIComponent(
					JSON.stringify( {
						t: Date.now() - DBG_T0,
						type,
						active: d( doc.activeElement ),
						anchor: d( sel?.anchorNode ),
						off: sel?.anchorOffset,
						...extra,
					} )
				),
			{ keepalive: true }
		);
	} catch ( e ) {}
}

export default function useRestoreTapCaret() {
	return useRefEffect< HTMLElement >( ( node ) => {
		const { ownerDocument } = node;
		// A mounted element's document has a window, with a selection.
		const selection = ownerDocument.defaultView!.getSelection()!;
		let caret: Range | undefined;

		function onFocusIn( event: FocusEvent ) {
			dbg( 'focusin', ownerDocument, { target: ( event.target as HTMLElement ).tagName + '.' + ( event.target as HTMLElement ).className.split( ' ' )[ 0 ], related: event.relatedTarget === node ? 'NODE' : String( ( event.relatedTarget as HTMLElement )?.tagName ), wrapperCE: node.contentEditable } );
			caret =
				event.relatedTarget === node &&
				selection.rangeCount &&
				( event.target as Node ).contains( selection.anchorNode )
					? selection.getRangeAt( 0 ).cloneRange()
					: undefined;
		}

		// A new press or key may move the caret anywhere.
		function forget( event?: Event ) {
			dbg( 'forget:' + event?.type, ownerDocument, { had: !! caret } );
			caret = undefined;
		}

		function onSelectionChange() {
			const { activeElement } = ownerDocument;
			dbg( 'selchange', ownerDocument, { had: !! caret } );
			if (
				caret &&
				selection.anchorNode &&
				! activeElement?.contains( selection.anchorNode )
			) {
				selection.removeAllRanges();
				selection.addRange( caret );
				caret = undefined;
				dbg( 'RESTORED', ownerDocument );
			}
		}

		const dbgEv = ( e: Event ) => dbg( e.type, ownerDocument, { data: ( e as InputEvent ).data, inputType: ( e as InputEvent ).inputType, defaultPrevented: e.defaultPrevented, wrapperCE: node.contentEditable } );
		[ 'beforeinput', 'input', 'focusout', 'pointerdown', 'mousedown', 'pointerup', 'click', 'compositionstart', 'touchstart', 'touchend' ].forEach( ( t ) => ownerDocument.addEventListener( t, dbgEv, true ) );
		dbg( 'mount', ownerDocument );
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
