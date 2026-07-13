/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useRegistry, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { hasBlockSupport } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { useBlockElement } from '../block-list/use-block-props/use-block-refs';
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
	const { selectedClientId, isZoomOut } = useSelect( ( select ) => {
		return {
			selectedClientId:
				select( blockEditorStore ).getSelectedBlockClientId(),
			isZoomOut: unlock( select( blockEditorStore ) ).isZoomOut(),
		};
	}, [] );
	const enabled = useHasEditableRoot() && ! isZoomOut;
	const blockElement = useBlockElement( enabled ? selectedClientId : null );
	// The editing host is the block's direct block list parent: the native
	// selection can extend across sibling blocks, while everything outside
	// the list (e.g. the post title) stays non-editable.
	const host = blockElement?.parentElement;

	useEffect( () => {
		if ( ! enabled || ! host ) {
			return;
		}

		host.setAttribute( 'contenteditable', 'true' );

		// Abort in environments without contentEditable support (JSDOM):
		// without editing host semantics the host must not claim to be one.
		if ( ! host.isContentEditable ) {
			host.removeAttribute( 'contenteditable' );
			return;
		}

		const { getSelectedBlockClientId } =
			registry.select( blockEditorStore );

		// Expose the host as a named multiline textbox so it has a role and
		// accessible name once it takes focus. The label is generic because
		// the host can span several blocks.
		host.setAttribute( 'role', 'textbox' );
		host.setAttribute( 'aria-multiline', 'true' );
		host.setAttribute( 'aria-label', __( 'Block list' ) );

		// Move focus from the block's editable element to the host, but
		// only when an editable element belonging to the selected block has
		// focus. Never steal focus from other regions (e.g. List View), UI
		// elements (e.g. buttons), or editables outside the host (e.g. the
		// post title). The selection is preserved. If the selection is
		// still outside the focused element, a mousedown just focused it
		// and the browser has not placed the caret yet; moving focus now
		// would cancel the pending caret placement. The selection observer
		// moves focus once the selection lands.
		const { activeElement } = host.ownerDocument;
		const selection = host.ownerDocument.defaultView.getSelection();
		if (
			activeElement !== host &&
			activeElement?.isContentEditable &&
			host.contains( activeElement ) &&
			getBlockClientId( activeElement ) === getSelectedBlockClientId() &&
			selection.anchorNode &&
			activeElement.contains( selection.anchorNode )
		) {
			host.focus();
		}

		return () => {
			host.removeAttribute( 'role' );
			host.removeAttribute( 'aria-multiline' );
			host.removeAttribute( 'aria-label' );
			// Remove the attribute rather than setting it to false: an
			// explicit false on a block list container would fence the
			// native selection when the multi-selection machinery makes the
			// whole canvas editable.
			host.removeAttribute( 'contenteditable' );

			// If the host held focus, return focus to the editable element
			// containing the selection, which is focusable again now that
			// the host is gone. Only do so if that element belongs to the
			// selected block: when the selection moved to another block
			// through the store, the stale DOM selection must not reclaim
			// block selection through its focus handler.
			if ( host.ownerDocument.activeElement === host ) {
				const editable = getSelectionEditableElement(
					host.ownerDocument.defaultView.getSelection(),
					host
				);
				if (
					editable &&
					getBlockClientId( editable ) === getSelectedBlockClientId()
				) {
					editable.focus();
				}
			}
		};
	}, [ enabled, host, registry ] );
}
