/**
 * WordPress dependencies
 */
import { dispatch } from '@wordpress/data';
// @ts-expect-error No exported types.
import { store as blockEditorStore } from '@wordpress/block-editor';
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
	// Try each position until we find one that exists in the document
	for ( const positionToTry of selectionHistory ) {
		const { start, end } = positionToTry;
		const startBlock = findBlockByClientIdInDoc( start.clientId, ydoc );
		const endBlock = findBlockByClientIdInDoc( end.clientId, ydoc );

		if ( ! startBlock || ! endBlock ) {
			// This block no longer exists, skip it.
			continue;
		}

		const startBlockSelection = convertYSelectionToBlockSelection(
			start,
			ydoc
		);
		const endBlockSelection = convertYSelectionToBlockSelection(
			end,
			ydoc
		);

		if ( startBlockSelection === null || endBlockSelection === null ) {
			continue;
		}

		return {
			selectionStart: startBlockSelection,
			selectionEnd: endBlockSelection,
		};
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
