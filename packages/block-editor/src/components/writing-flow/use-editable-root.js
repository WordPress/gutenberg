/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';
import { hasBlockSupport } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { getBlockClientId, getSelectionEditableElement } from '../../utils/dom';
import { unlock } from '../../lock-unlock';

/**
 * Returns true when the writing flow wrapper should be contentEditable: the
 * selected block supports `editableRoot`.
 *
 * @return {Object} Whether the wrapper should be editable, and the selected
 *                  block client ID.
 */
export function useHasEditableRoot() {
	return useSelect( ( select ) => {
		const { getSelectedBlockClientId, getBlockName, getBlockEditingMode } =
			select( blockEditorStore );
		const clientId = getSelectedBlockClientId();
		return {
			selectedClientId: clientId,
			hasEditableRoot:
				!! clientId &&
				getBlockEditingMode( clientId ) === 'default' &&
				hasBlockSupport(
					getBlockName( clientId ),
					'editableRoot',
					false
				),
		};
	}, [] );
}

/**
 * Keeps the writing flow wrapper contentEditable while the selected block
 * supports `editableRoot`, so the native selection can extend across blocks.
 * While the wrapper is editable it must also hold focus: a nested editable
 * element cannot retain focus once an ancestor becomes an editing host (the
 * first DOM mutation moves focus to the host, inconsistently across
 * browsers).
 */
export default function useEditableRoot() {
	const { hasMultiSelection, isMultiSelecting, isZoomOut } = unlock(
		useSelect( blockEditorStore )
	);
	const { selectedClientId, hasEditableRoot: supportsEditableRoot } =
		useHasEditableRoot();

	return useRefEffect(
		( node ) => {
			// Only a canvas in its own (iframed) document may become an
			// editing host: in non-iframed editors (e.g. the widgets
			// screens) the wrapper is an ordinary element within the admin
			// page, and making it an editing host holding focus interferes
			// with the surrounding page (tab order, focus driven UI, key
			// events bubbling without a document boundary).
			const isIframedCanvas = node.ownerDocument !== document;

			if ( supportsEditableRoot && ! isZoomOut() && isIframedCanvas ) {
				if ( node.getAttribute( 'contenteditable' ) !== 'true' ) {
					node.setAttribute( 'contenteditable', 'true' );

					// Abort in environments without contentEditable support
					// (JSDOM): without editing host semantics the wrapper
					// must not claim to be one.
					if ( ! node.isContentEditable ) {
						node.removeAttribute( 'contenteditable' );
						return;
					}
				}

				// Move focus from the block's editable element to the
				// wrapper, but only when an editable element belonging to
				// the selected block has focus. Never steal focus from other
				// regions (e.g. List View), UI elements (e.g. buttons), or
				// other editables within the wrapper (e.g. the post title).
				// The selection is preserved.
				const { activeElement } = node.ownerDocument;
				if (
					activeElement !== node &&
					activeElement?.isContentEditable &&
					node.contains( activeElement ) &&
					getBlockClientId( activeElement ) === selectedClientId
				) {
					node.focus();
				}
			} else if (
				node.getAttribute( 'contenteditable' ) === 'true' &&
				! hasMultiSelection() &&
				! isMultiSelecting()
			) {
				node.setAttribute( 'contenteditable', 'false' );

				// If the wrapper held focus, return focus to the editable
				// element containing the selection, which is focusable again
				// now that the wrapper is no longer an editing host. Only do
				// so if that element belongs to the selected block: when the
				// selection moved to another block through the store, the
				// stale DOM selection must not reclaim block selection
				// through its focus handler.
				if ( node.ownerDocument.activeElement === node ) {
					const selection =
						node.ownerDocument.defaultView.getSelection();
					const editable = getSelectionEditableElement(
						selection,
						node
					);
					if (
						editable &&
						getBlockClientId( editable ) === selectedClientId
					) {
						editable.focus();
					}
				}
			}
		},
		[ supportsEditableRoot, selectedClientId ]
	);
}
