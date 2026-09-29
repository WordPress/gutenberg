import { useRegistry } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';
import { store as blockEditorStore } from '../../store';
import { setContentEditableWrapper } from './utils';
import { getBlockClientId, getSelectionEditableElement } from '../../utils/dom';
import { unlock } from '../../lock-unlock';

/**
 * Keeps the writing flow wrapper contentEditable while the selected block
 * supports `editableRoot`, so the native selection can extend across blocks.
 * The switch is imperative and happens when the selection changes, in the
 * same tick. While the wrapper is editable it must also hold focus: a nested
 * editable element cannot retain focus once an ancestor becomes an editing
 * host (the first DOM mutation moves focus to the host, inconsistently
 * across browsers).
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

			function disengage() {
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
				// A multi-selection owns the wrapper as its editing host: the
				// host and its textbox semantics remain, and the selection
				// observer disables both together when the selection
				// collapses. Removing the attributes here would strip the
				// accessible name off the focused editing host at the moment
				// cross-block editing begins.
				if ( hasMultiSelection() || isMultiSelecting() ) {
					return;
				}

				const clientId = getSelectedBlockClientId();
				const enabled =
					! isZoomOut() && canHostEditableRoot( clientId );

				if ( ! enabled ) {
					// The selection observer may have disabled the wrapper
					// already.
					if ( node.contentEditable === 'true' ) {
						disengage();
					}
					return;
				}

				// A block's focus handler selects the block before the
				// browser places the caret in the focused field (WebKit
				// does so after the focus event, and then in the wrapper
				// once the host took focus). Place it at the start of the
				// field, as the browser would.
				const { activeElement } = ownerDocument;
				const selection = defaultView.getSelection();
				if (
					activeElement !== node &&
					node.contains( activeElement ) &&
					! selection.anchorNode
				) {
					selection.collapse( activeElement, 0 );
				}

				setContentEditableWrapper( node, true );
			}

			sync();
			const unsubscribe = registry.subscribe( sync, blockEditorStore );

			return () => {
				unsubscribe();
				if ( node.contentEditable === 'true' ) {
					disengage();
				}
			};
		},
		[ registry ]
	);
}
