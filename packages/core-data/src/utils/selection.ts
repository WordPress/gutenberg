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
import type { YSelectionHistory } from './block-selection-history';

/**
 * Restore the selection to the most recent selection in history that is
 * available in the document.
 * @param selectionHistory The selection history to restore
 * @param ydoc             The Y.Doc where blocks are stored
 */
export function restoreSelection(
	selectionHistory: YSelectionHistory,
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

/**
 * Compare two selection objects by their attributes.
 *
 * @param {WPSelection | undefined} selectionA - First selection object
 * @param {WPSelection | undefined} selectionB - Second selection object
 * @return {boolean} True if selections are equal, false otherwise
 */
export function areSelectionsEqual(
	selectionA: WPSelection | undefined,
	selectionB: WPSelection | undefined
): boolean {
	if ( selectionA === selectionB ) {
		return true;
	}

	if ( ! selectionA || ! selectionB ) {
		return false;
	}

	return (
		areBlockSelectionsEqual(
			selectionA.selectionStart,
			selectionB.selectionStart
		) &&
		areBlockSelectionsEqual(
			selectionA.selectionEnd,
			selectionB.selectionEnd
		)
	);
}

/**
 * Compare two WPBlockSelection objects by their attributes.
 *
 * @param {WPBlockSelection | undefined} selectionA - First block selection
 * @param {WPBlockSelection | undefined} selectionB - Second block selection
 * @return {boolean} True if block selections are equal, false otherwise
 */
function areBlockSelectionsEqual(
	selectionA: WPBlockSelection | undefined,
	selectionB: WPBlockSelection | undefined
): boolean {
	if ( selectionA === selectionB ) {
		return true;
	}

	if ( ! selectionA || ! selectionB ) {
		return false;
	}

	return (
		selectionA.clientId === selectionB.clientId &&
		selectionA.attributeKey === selectionB.attributeKey &&
		selectionA.offset === selectionB.offset
	);
}
