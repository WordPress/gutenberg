/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useRegistry, useSelect } from '@wordpress/data';
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
 * @return {boolean} Whether the wrapper should be editable.
 */
export function useHasEditableRoot() {
	return useSelect( ( select ) => {
		const {
			getSelectedBlockClientId,
			getBlockName,
			getBlockEditingMode,
			getBlockMode,
			getBlockRootClientId,
			getBlockOrder,
		} = select( blockEditorStore );
		const clientId = getSelectedBlockClientId();
		return (
			!! clientId &&
			getBlockEditingMode( clientId ) === 'default' &&
			// Not when the block is edited as HTML: there is no rich text
			// to host then, only a textarea, which the editing host would
			// interfere with.
			getBlockMode( clientId ) === 'visual' &&
			hasBlockSupport(
				getBlockName( clientId ),
				'editableRoot',
				false
			) &&
			// Only host when the block has sibling blocks for a native
			// selection to extend into. A lone block (e.g. a single
			// paragraph nested in an HTML block) is edited on its own
			// element, not through a canvas-wide editing host.
			getBlockOrder( getBlockRootClientId( clientId ) ).length > 1
		);
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
	const isZoomOut = useSelect(
		( select ) => unlock( select( blockEditorStore ) ).isZoomOut(),
		[]
	);
	const enabled = useHasEditableRoot() && ! isZoomOut;

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

			node.setAttribute( 'contenteditable', 'true' );

			// Abort in environments without contentEditable support (JSDOM):
			// without editing host semantics the wrapper must not claim to
			// be one.
			if ( ! node.isContentEditable ) {
				node.removeAttribute( 'contenteditable' );
				return;
			}

			// Expose the host as a named multiline textbox so it has a role
			// and accessible name once it takes focus. The label is generic
			// because the host can span several blocks.
			node.setAttribute( 'role', 'textbox' );
			node.setAttribute( 'aria-multiline', 'true' );
			node.setAttribute( 'aria-label', __( 'Editor canvas' ) );

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
				node.removeAttribute( 'role' );
				node.removeAttribute( 'aria-multiline' );
				node.removeAttribute( 'aria-label' );

				// A multi-selection owns the wrapper as its editing host
				// now; the selection observer disables it when the
				// selection collapses.
				if ( hasMultiSelection() || isMultiSelecting() ) {
					return;
				}

				node.setAttribute( 'contenteditable', 'false' );

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
