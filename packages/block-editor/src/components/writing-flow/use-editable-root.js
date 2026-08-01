/**
 * WordPress dependencies
 */
import { useRegistry, useSelect } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import {
	setContentEditableWrapper,
	getRecentClickPoint,
	caretRangeFromPoint,
} from './utils';
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
			} else if (
				activeElement === node &&
				node.ownerDocument.hasFocus() &&
				! node.matches( ':focus' )
			) {
				// Focus must genuinely be within the document: the wrapper is
				// also the default activeElement while the user works in the
				// top document (e.g. the block toolbar), and stealing focus
				// from there is never right.
				// Becoming the editing host turns the selected block's
				// editable into an inert part of the host
				// (contenteditable="inherit"): if it held focus, the browser
				// dropped focus, leaving the wrapper as the default
				// activeElement without actually focusing it.
				const selectedClientId = getSelectedBlockClientId();

				if (
					selection.anchorNode &&
					node.contains( selection.anchorNode ) &&
					getBlockClientId( selection.anchorNode ) ===
						selectedClientId
				) {
					// The caret survived: reclaim focus for the host so it
					// keeps an editing context.
					node.focus( { preventScroll: true } );
				} else {
					// A mousedown placed the caret in the block's editable
					// and selected the block, and the flip to inert dropped
					// the caret mid-click. Restore it from the pointer
					// position, then focus the host, which adopts it.
					const point = getRecentClickPoint( node );
					const range =
						point &&
						caretRangeFromPoint(
							node.ownerDocument,
							point.x,
							point.y
						);

					if (
						range &&
						node.contains( range.startContainer ) &&
						getBlockClientId( range.startContainer ) ===
							selectedClientId
					) {
						selection.removeAllRanges();
						selection.addRange( range );
						node.focus( { preventScroll: true } );
					}
				}
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
