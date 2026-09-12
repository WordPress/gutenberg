import { useRegistry, useSelect } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';
import { store as blockEditorStore } from '../../store';
import { setContentEditableWrapper } from './utils';
import { getBlockClientId, getSelectionEditableElement } from '../../utils/dom';
import { unlock } from '../../lock-unlock';

/**
 * Keeps the writing flow wrapper contentEditable while the selected block
 * supports `editableRoot`, so the native selection can extend across blocks.
 * While the wrapper is editable it must also hold focus: a nested editable
 * element cannot retain focus once an ancestor becomes an editing host (the
 * first DOM mutation moves focus to the host, inconsistently across
 * browsers).
 */
export default function useEditableRoot() {
	const registry = useRegistry();
	const enabled = useSelect( ( select ) => {
		const { getSelectedBlockClientId, canHostEditableRoot, isZoomOut } =
			unlock( select( blockEditorStore ) );
		return (
			! isZoomOut() && canHostEditableRoot( getSelectedBlockClientId() )
		);
	}, [] );

	return useRefEffect(
		( node ) => {
			if ( ! enabled ) {
				return;
			}

			const {
				getSelectedBlockClientId,
				hasMultiSelection,
				isMultiSelecting,
			} = registry.select( blockEditorStore );

			// Focus is moved separately below, only when an editable
			// element belonging to the selected block holds it.
			if ( ! setContentEditableWrapper( node, true, { focus: false } ) ) {
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
			const { activeElement } = node.ownerDocument;
			const selection = node.ownerDocument.defaultView.getSelection();
			if (
				activeElement !== node &&
				activeElement?.isContentEditable &&
				node.contains( activeElement ) &&
				getBlockClientId( activeElement ) ===
					getSelectedBlockClientId() &&
				selection.anchorNode &&
				activeElement.contains( selection.anchorNode )
			) {
				node.focus();
			}

			return () => {
				// A multi-selection owns the wrapper as its editing host
				// now: the host and its textbox semantics remain, and the
				// selection observer disables both together when the
				// selection collapses. Removing the attributes here would
				// strip the accessible name off the focused editing host at
				// the moment cross-block editing begins.
				if ( hasMultiSelection() || isMultiSelecting() ) {
					return;
				}

				setContentEditableWrapper( node, false );

				// If the wrapper held focus, return focus to the editable
				// element containing the selection, which is focusable
				// again now that the wrapper is no longer an editing host.
				// Only do so if that element belongs to the selected block:
				// when the selection moved to another block through the
				// store, the stale DOM selection must not reclaim block
				// selection through its focus handler.
				if ( node.ownerDocument.activeElement === node ) {
					const editable = getSelectionEditableElement(
						node.ownerDocument.defaultView.getSelection(),
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
			};
		},
		[ enabled, registry ]
	);
}
