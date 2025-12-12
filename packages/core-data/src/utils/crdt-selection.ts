/**
 * WordPress dependencies
 */
import { dispatch } from '@wordpress/data';
// @ts-expect-error No exported types.
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import type { WPBlockSelection, WPSelection } from '../types';
import type { Y } from '@wordpress/sync';
import { findSelectionFromHistory } from './crdt';
import type { YFullSelection } from './block-selection-history';

/**
 * Restore the selection to the most recent selection in history that is
 * available in the document.
 * @param selectionHistory The selection history to restore
 * @param ydoc             The Y.Doc where blocks are stored
 */
export function restoreSelection(
	selectionHistory: YFullSelection[],
	ydoc: Y.Doc
): void {
	// Find the most recent selection in history that is available in
	// the document.
	const selectionToRestore = findSelectionFromHistory(
		ydoc,
		selectionHistory
	);

	if ( selectionToRestore === null ) {
		// Case 1: No blocks in history are available for restoration.
		// Do nothing.
		return;
	}

	const { resetSelection } = dispatch( blockEditorStore );
	const { selectionStart, selectionEnd } = selectionToRestore;
	const isSelectionInSameBlock =
		selectionStart.clientId === selectionEnd.clientId;

	if ( isSelectionInSameBlock ) {
		// Case 2: After content is restored, the selection is available
		// within the same block
		resetSelection( selectionStart, selectionEnd, null );
	} else {
		// Case 3: A multi-block selection was made. resetSelection() can only
		// restore selections within the same block.
		// When a multi-block selection is made, selectionEnd represents
		// where the user's cursor ended.
		resetSelection( selectionEnd, selectionEnd, null );
	}
}
