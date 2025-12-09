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
import type { ObjectData, Y } from '@wordpress/sync';
import {
	convertYSelectionToBlockSelection,
	findBlockByClientIdInDoc,
	findSelectionFromHistory,
} from './crdt';
import type { YSelectionHistory } from './block-selection-history';

// Set the current selection. This is used to restore selection position
// when triggering an undo/redo.
export function restoreSelection(
	selectionHistory: YSelectionHistory,
	ydoc: Y.Doc,
	editRecord: ( data: Partial< ObjectData > ) => void
): void {
	const { selection } = selectionHistory;

	const isSelectionInASingleBlockAndAvailable =
		findBlockByClientIdInDoc( selection.start.clientId, ydoc ) !== null &&
		selection.start.clientId === selection.end.clientId;

	if ( isSelectionInASingleBlockAndAvailable ) {
		// Case 1: Restore selection to a block that's already available,
		// with a simple selection.
		const selectionStart = convertYSelectionToBlockSelection(
			selection.start,
			ydoc
		);
		const selectionEnd = convertYSelectionToBlockSelection(
			selection.end,
			ydoc
		);

		// Because this block is available, we can restore the selection
		// immediately using editRecord().
		editRecord( {
			selection: {
				selectionStart,
				selectionEnd,
				initialPosition: null,
			},
		} );
	} else {
		// In any other scenario, use setTimeout() to wait until content
		// is restored, and then run selection logic using resetSelection().
		//
		// Note that we can only use editRecord() to change the visual selection
		// if it is run immediately. Within a deferred call, editRecord() with
		// a selection property will not cause a visual selection change unless
		// a block change event fires as well.

		setTimeout( () => {
			// After content is updated, find the most recent selection in
			// history that is available in the document.
			const selectionToRestore = findSelectionFromHistory(
				ydoc,
				selectionHistory
			);

			if ( selectionToRestore === null ) {
				// Case 2: No blocks in history are available for restoration.
				// Do nothing.
				return;
			}

			const { resetSelection } = dispatch( blockEditorStore );
			const { selectionStart, selectionEnd } = selectionToRestore;
			const isSelectionInSameBlock =
				selectionStart.clientId === selectionEnd.clientId;

			if ( isSelectionInSameBlock ) {
				// Case 3: After content is restored, the selection is available
				// within the same block
				resetSelection( selectionStart, selectionEnd, null );
			} else {
				// Case 4: A multi-block selection was made. resetSelection() can only
				// restore selections within the same block.
				// When a multi-block selection is made, selectionEnd represents
				// where the user's cursor ended.
				resetSelection( selectionEnd, selectionEnd, null );
			}
		} );
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
