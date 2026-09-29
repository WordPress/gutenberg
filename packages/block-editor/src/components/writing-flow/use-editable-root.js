import { useRegistry } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';
import { store as blockEditorStore } from '../../store';
import { setContentEditableWrapper } from './utils';
import {
	getBlockClientId,
	getSelectionEditableElement,
	isInsideRootBlock,
} from '../../utils/dom';
import { unlock } from '../../lock-unlock';

const FIELD_SELECTOR = '[data-wp-block-attribute-key]';

/**
 * Keeps the writing flow wrapper contentEditable while the selected block
 * supports `editableRoot`, so the native selection can extend across blocks.
 * The switch is imperative and happens when the selection changes, in the
 * same tick: the wrapper becomes the editing host and the selected block's
 * fields stop being editable elements of their own, together. Rich text
 * renders the same state for the fields, so a later render does not restore
 * their attributes. While the wrapper is editable it must also hold focus: a
 * nested editable element cannot retain focus once an ancestor becomes an
 * editing host (the first DOM mutation moves focus to the host,
 * inconsistently across browsers).
 */
export default function useEditableRoot() {
	const registry = useRegistry();

	return useRefEffect(
		( node ) => {
			const {
				getSelectedBlockClientId,
				canHostEditableRoot,
				isZoomOut,
				hasMultiSelection,
				isMultiSelecting,
			} = unlock( registry.select( blockEditorStore ) );
			const { ownerDocument } = node;
			const { defaultView } = ownerDocument;

			// Whether this hook engaged the host, the block it hosts and the
			// fields made inert for it, to make them editable again when the
			// host moves on or disengages.
			let engaged = false;
			let hostedClientId = null;
			let hostedFields = [];

			function getFields( clientId ) {
				const blockElement = node.querySelector(
					`[data-block="${ clientId }"]`
				);
				if ( ! blockElement ) {
					return [];
				}
				return Array.from(
					blockElement.querySelectorAll( FIELD_SELECTOR )
				).filter(
					( field ) =>
						field.getAttribute( 'contenteditable' ) === 'true' &&
						isInsideRootBlock( blockElement, field )
				);
			}

			function releaseFields() {
				for ( const field of hostedFields ) {
					field.setAttribute( 'contenteditable', 'true' );
				}
				hostedFields = [];
			}

			function engage( clientId ) {
				// Focus is moved separately below, only when an editable
				// element belonging to the selected block holds it.
				if (
					! setContentEditableWrapper( node, true, { focus: false } )
				) {
					return;
				}

				// Move focus from the block's editable element to the wrapper,
				// but only when an editable element belonging to the selected
				// block has focus. Never steal focus from other regions (e.g.
				// List View), UI elements (e.g. buttons), or other editables
				// within the wrapper (e.g. the post title). The selection is
				// preserved. If the selection is still outside the focused
				// element, a mousedown just focused it and the browser has not
				// placed the caret yet; moving focus now would cancel the
				// pending caret placement. The selection observer moves focus
				// once the selection lands.
				const { activeElement } = ownerDocument;
				const selection = defaultView.getSelection();
				if (
					activeElement !== node &&
					activeElement?.isContentEditable &&
					node.contains( activeElement ) &&
					getBlockClientId( activeElement ) === clientId &&
					selection.anchorNode &&
					activeElement.contains( selection.anchorNode )
				) {
					node.focus();
				}

				// The fields are edited through the host now. Remove the
				// attribute so they are not editing hosts nested in it, and
				// the tabindex that made them focus targets.
				engaged = true;
				hostedClientId = clientId;
				hostedFields = getFields( clientId );
				for ( const field of hostedFields ) {
					field.removeAttribute( 'contenteditable' );
					field.removeAttribute( 'tabindex' );
				}
			}

			function disengage() {
				releaseFields();
				engaged = false;
				hostedClientId = null;
				setContentEditableWrapper( node, false );

				// If the wrapper held focus, return focus to the editable
				// element containing the selection, which is focusable
				// again now that the wrapper is no longer an editing host.
				// Only do so if that element belongs to the selected block:
				// when the selection moved to another block through the
				// store, the stale DOM selection must not reclaim block
				// selection through its focus handler.
				if ( ownerDocument.activeElement === node ) {
					const editable = getSelectionEditableElement(
						defaultView.getSelection(),
						node
					);
					if (
						editable &&
						getBlockClientId( editable ) ===
							getSelectedBlockClientId()
					) {
						editable.focus();
					}
				}
			}

			function sync() {
				const clientId = getSelectedBlockClientId();
				const enabled =
					! isZoomOut() && canHostEditableRoot( clientId );

				if ( enabled && clientId === hostedClientId ) {
					return;
				}

				// A multi-selection owns the wrapper as its editing host
				// now: the host and its textbox semantics remain, and the
				// selection observer disables both together when the
				// selection collapses. Removing the attributes here would
				// strip the accessible name off the focused editing host at
				// the moment cross-block editing begins. The fields stay
				// inert too: rich text renders every multi-selected block's
				// field inert.
				if ( hasMultiSelection() || isMultiSelecting() ) {
					hostedClientId = null;
					return;
				}

				if ( enabled ) {
					// The host moves to another block: the previous block's
					// fields become editable elements again.
					releaseFields();
					engage( clientId );
				} else if ( engaged ) {
					disengage();
				}
			}

			sync();
			const unsubscribe = registry.subscribe( sync, blockEditorStore );

			return () => {
				unsubscribe();
				if ( engaged ) {
					disengage();
				}
			};
		},
		[ registry ]
	);
}
