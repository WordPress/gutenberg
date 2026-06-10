/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { getSelectionEditableElement } from '../../utils/dom';

const EVENT_TYPES = [
	'keydown',
	'beforeinput',
	'input',
	'compositionstart',
	'compositionupdate',
	'compositionend',
];

/**
 * While the wrapper is the contentEditable editing host (a selected block
 * supports `editableRoot`), keyboard, input, and composition events target
 * the wrapper instead of the editable element containing the selection.
 * Listeners bound to that element (rich text, block handlers, React props)
 * would never fire. Clipboard events are not redirected: their handlers are
 * window- or document-bound and check selection ownership themselves.
 *
 * This hook redirects such events: it dispatches a clone on the editable
 * element containing the selection so every listener sees the event exactly
 * as if the element itself had focus, mirrors `preventDefault` back to the
 * real event, and stops the real event so nothing handles it twice.
 *
 * Must be the first listener registered on the wrapper so it runs before
 * other writing flow handlers.
 */
const NEUTRALIZED = Symbol( 'neutralized' );

/**
 * Synthetic keyboard events have no editing default action, but WebKit may
 * still run other default handling for them, like navigating back in
 * history for an unprevented Backspace. Prevent untrusted, unprevented
 * Backspace/Delete events as the last listener, marking them so the
 * `preventDefault` mirroring ignores it.
 *
 * @param {KeyboardEvent} event The keydown event.
 */
function neutralizeSyntheticDeleteKeys( event ) {
	if (
		! event.isTrusted &&
		! event.defaultPrevented &&
		( event.key === 'Backspace' || event.key === 'Delete' )
	) {
		event[ NEUTRALIZED ] = true;
		event.preventDefault();
	}
}

export default function useEventRedirect() {
	const { hasMultiSelection } = useSelect( blockEditorStore );
	return useRefEffect( ( node ) => {
		function onEvent( event ) {
			if ( event.target !== node || ! event.isTrusted ) {
				return;
			}

			if ( node.contentEditable !== 'true' || hasMultiSelection() ) {
				return;
			}

			const { ownerDocument } = node;
			const selection = ownerDocument.defaultView.getSelection();

			if ( ! selection.rangeCount ) {
				return;
			}

			const editable = getSelectionEditableElement( selection, node );

			if ( ! editable ) {
				return;
			}

			const clone = new event.constructor( event.type, event );
			editable.dispatchEvent( clone );

			if ( clone.defaultPrevented && ! clone[ NEUTRALIZED ] ) {
				event.preventDefault();
			}

			event.stopImmediatePropagation();
		}

		const { ownerDocument } = node;
		EVENT_TYPES.forEach( ( type ) =>
			node.addEventListener( type, onEvent )
		);
		ownerDocument.addEventListener(
			'keydown',
			neutralizeSyntheticDeleteKeys
		);
		return () => {
			EVENT_TYPES.forEach( ( type ) =>
				node.removeEventListener( type, onEvent )
			);
			ownerDocument.removeEventListener(
				'keydown',
				neutralizeSyntheticDeleteKeys
			);
		};
	}, [] );
}
