/**
 * WordPress dependencies
 */
import { dispatch, select } from '@wordpress/data';
// @ts-expect-error No exported types.
import { store as blockEditorStore } from '@wordpress/block-editor';
// @ts-expect-error No exported types.
import { isUnmodifiedBlock } from '@wordpress/blocks';
import { type CRDTDoc, Y } from '@wordpress/sync';

/**
 * Internal dependencies
 */
import {
	createBlockSelectionHistory,
	YSelectionType,
	type BlockSelectionHistory,
	type YFullSelection,
	type YSelection,
} from './block-selection-history';
import { findBlockByClientIdInDoc } from './crdt-utils';
import type { WPBlockSelection, WPSelection } from '../types';

// WeakMap to store BlockSelectionHistory instances per Y.Doc
const selectionHistoryMap = new WeakMap< CRDTDoc, BlockSelectionHistory >();

/**
 * Get or create a BlockSelectionHistory instance for a given Y.Doc.
 *
 * @param ydoc The Y.Doc to get the selection history for
 * @return The BlockSelectionHistory instance
 */
function getBlockSelectionHistory( ydoc: CRDTDoc ): BlockSelectionHistory {
	let history = selectionHistoryMap.get( ydoc );

	if ( ! history ) {
		history = createBlockSelectionHistory( ydoc );
		selectionHistoryMap.set( ydoc, history );
	}

	return history;
}

export function getSelectionHistory( ydoc: CRDTDoc ): YFullSelection[] {
	return getBlockSelectionHistory( ydoc ).getSelectionHistory();
}

export function updateSelectionHistory(
	ydoc: CRDTDoc,
	wpSelection: WPSelection
): void {
	return getBlockSelectionHistory( ydoc ).updateSelection( wpSelection );
}

/**
 * Convert a YSelection to a WPBlockSelection.
 * @param ySelection The YSelection (relative) to convert
 * @param ydoc       The Y.Doc to convert the selection to a block selection for
 * @return The converted WPBlockSelection, or null if the conversion fails
 */
function convertYSelectionToBlockSelection(
	ySelection: YSelection,
	ydoc: Y.Doc
): WPBlockSelection | null {
	if ( ySelection.type === YSelectionType.RelativeSelection ) {
		const { relativePosition, attributeKey, clientId } = ySelection;

		const absolutePosition = Y.createAbsolutePositionFromRelativePosition(
			relativePosition,
			ydoc
		);

		if ( absolutePosition ) {
			return {
				clientId,
				attributeKey,
				offset: absolutePosition.index,
			};
		}
	} else if ( ySelection.type === YSelectionType.BlockSelection ) {
		return {
			clientId: ySelection.clientId,
			attributeKey: undefined,
			offset: undefined,
		};
	}

	return null;
}

/**
 * Convert a YFullSelection to a WPSelection by resolving relative positions
 * and verifying the blocks exist in the document.
 * @param yFullSelection The YFullSelection to convert
 * @param ydoc           The Y.Doc to resolve positions against
 * @return The converted WPSelection, or null if the conversion fails
 */
function convertYFullSelectionToWPSelection(
	yFullSelection: YFullSelection,
	ydoc: Y.Doc
): WPSelection | null {
	const { start, end } = yFullSelection;
	const startBlock = findBlockByClientIdInDoc( start.clientId, ydoc );
	const endBlock = findBlockByClientIdInDoc( end.clientId, ydoc );

	if ( ! startBlock || ! endBlock ) {
		return null;
	}

	const startBlockSelection = convertYSelectionToBlockSelection(
		start,
		ydoc
	);
	const endBlockSelection = convertYSelectionToBlockSelection( end, ydoc );

	if ( startBlockSelection === null || endBlockSelection === null ) {
		return null;
	}

	return {
		selectionStart: startBlockSelection,
		selectionEnd: endBlockSelection,
	};
}

/**
 * Given a Y.Doc and a selection history, find the most recent selection
 * that exists in the document. Skip any selections that are not in the document.
 * @param ydoc             The Y.Doc to find the selection in
 * @param selectionHistory The selection history to check
 * @return The most recent selection that exists in the document, or null if no selection exists.
 */
function findSelectionFromHistory(
	ydoc: Y.Doc,
	selectionHistory: YFullSelection[]
): WPSelection | null {
	for ( const positionToTry of selectionHistory ) {
		const result = convertYFullSelectionToWPSelection(
			positionToTry,
			ydoc
		);
		if ( result !== null ) {
			return result;
		}
	}

	return null;
}

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

	const { getBlock } = select( blockEditorStore );
	const { resetSelection } = dispatch( blockEditorStore );
	const { selectionStart, selectionEnd } = selectionToRestore;
	const isSelectionInSameBlock =
		selectionStart.clientId === selectionEnd.clientId;

	if ( isSelectionInSameBlock ) {
		// Case 2: After content is restored, the selection is available
		// within the same block

		const block = getBlock( selectionStart.clientId );
		const isBlockEmpty = block && isUnmodifiedBlock( block );
		const isBeginningOfEmptyBlock =
			0 === selectionStart.offset &&
			0 === selectionEnd.offset &&
			isBlockEmpty &&
			! selectionStart.attributeKey &&
			! selectionEnd.attributeKey;

		if ( isBeginningOfEmptyBlock ) {
			// Case 2a: When the content in a block has been removed after an
			// undo, WordPress will set the selection to the block's client ID
			// with an undefined startOffset and endOffset.
			//
			// To match the default behavior and tests, exclude the selection
			// offset when resetting to position 0.
			const selectionStartWithoutOffset = {
				clientId: selectionStart.clientId,
			};
			const selectionEndWithoutOffset = {
				clientId: selectionEnd.clientId,
			};

			resetSelection(
				selectionStartWithoutOffset,
				selectionEndWithoutOffset,
				0
			);
		} else {
			// Case 2b: Otherwise, reset including the saved selection offset.
			resetSelection( selectionStart, selectionEnd, 0 );
		}
	} else {
		// Case 3: A multi-block selection was made. resetSelection() can only
		// restore selections within the same block.
		// When a multi-block selection is made, selectionEnd represents
		// where the user's cursor ended.
		resetSelection( selectionEnd, selectionEnd, 0 );
	}
}

/**
 * If the latest selection has been shifted by remote edits, resolve and return
 * it as a WPSelection. Returns null when the history is empty or neither
 * endpoint has moved.
 *
 * @param ydoc             The Y.Doc to resolve positions against
 * @param selectionHistory The selection history to check
 * @return The shifted WPSelection, or null if nothing moved.
 */
export function getShiftedSelection(
	ydoc: Y.Doc,
	selectionHistory: YFullSelection[]
): WPSelection | null {
	if ( selectionHistory.length === 0 ) {
		return null;
	}

	const { start, end } = selectionHistory[ 0 ];

	// Block-level selections have no offset that can shift.
	if (
		start.type === YSelectionType.BlockSelection ||
		end.type === YSelectionType.BlockSelection
	) {
		return null;
	}

	const selectionStart = convertYSelectionToBlockSelection( start, ydoc );
	const selectionEnd = convertYSelectionToBlockSelection( end, ydoc );

	if ( ! selectionStart || ! selectionEnd ) {
		return null;
	}

	// Only dispatch if at least one endpoint actually moved.
	const startShifted = selectionStart.offset !== start.offset;
	const endShifted = selectionEnd.offset !== end.offset;

	if ( ! startShifted && ! endShifted ) {
		return null;
	}

	return { selectionStart, selectionEnd };
}
