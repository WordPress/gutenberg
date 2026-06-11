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
			if ( supportsEditableRoot && ! isZoomOut() ) {
				if ( node.contentEditable !== 'true' ) {
					node.contentEditable = true;
				}

				// Move focus from the block's editable element to the
				// wrapper, but only when such an element within the wrapper
				// has focus. Never steal focus from other regions (e.g. List
				// View) or UI elements (e.g. buttons). The selection is
				// preserved.
				const { activeElement } = node.ownerDocument;
				if (
					activeElement !== node &&
					activeElement?.isContentEditable &&
					node.contains( activeElement )
				) {
					node.focus();
				}
			} else if (
				node.contentEditable === 'true' &&
				! hasMultiSelection() &&
				! isMultiSelecting()
			) {
				node.contentEditable = false;

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
