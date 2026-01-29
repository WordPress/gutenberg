/**
 * External dependencies
 */
import { Y, CRDT_RECORD_MAP_KEY } from '@wordpress/sync';

/**
 * Internal dependencies
 */
import type { YPostRecord } from './crdt';
import type { YBlock, YBlocks } from './crdt-blocks';
import { getRootMap } from './crdt-utils';
import type { WPBlockSelection } from '../types';

/**
 * The type of selection.
 */
export enum SelectionType {
	None = 'none',
	Cursor = 'cursor',
	SelectionInOneBlock = 'selection-in-one-block',
	SelectionInMultipleBlocks = 'selection-in-multiple-blocks',
	WholeBlock = 'whole-block',
}

/**
 * The position of the cursor.
 */
export type CursorPosition = {
	relativePosition: Y.RelativePosition;

	// Also store the absolute offset index of the cursor from the perspective
	// of the user who is updating the selection.
	//
	// Do not use this value directly, instead use `createAbsolutePositionFromRelativePosition()`
	// on relativePosition for the most up-to-date positioning.
	//
	// This is used because local Y.Text changes (e.g. adding or deleting a character)
	// can result in the same relative position if it is pinned to an unchanged
	// character. With both of these values as editor state, a change in perceived
	// position will always result in a redraw.
	absoluteOffset: number;
};

export type SelectionNone = {
	// The user has not made a selection.
	type: SelectionType.None;
};

export type SelectionCursor = {
	// The user has a cursor position in a block with no text highlighted.
	type: SelectionType.Cursor;
	blockId: string;
	cursorPosition: CursorPosition;
};

export type SelectionInOneBlock = {
	// The user has highlighted text in a single block.
	type: SelectionType.SelectionInOneBlock;
	blockId: string;
	cursorStartPosition: CursorPosition;
	cursorEndPosition: CursorPosition;
};

export type SelectionInMultipleBlocks = {
	// The user has highlighted text over multiple blocks.
	type: SelectionType.SelectionInMultipleBlocks;
	blockStartId: string;
	blockEndId: string;
	cursorStartPosition: CursorPosition;
	cursorEndPosition: CursorPosition;
};

export type SelectionWholeBlock = {
	// The user has a non-text block selected, like an image block.
	type: SelectionType.WholeBlock;
	blockId: string;
};

export type SelectionState =
	| SelectionNone
	| SelectionCursor
	| SelectionInOneBlock
	| SelectionInMultipleBlocks
	| SelectionWholeBlock;

/**
 * Converts WordPress block editor selection to a SelectionState.
 *
 * @param selectionStart - The start position of the selection
 * @param selectionEnd   - The end position of the selection
 * @param yDoc           - The Yjs document
 * @return The SelectionState
 */
export function getSelectionState(
	selectionStart: WPBlockSelection,
	selectionEnd: WPBlockSelection,
	yDoc: Y.Doc
): SelectionState {
	const ymap = getRootMap< YPostRecord >( yDoc, CRDT_RECORD_MAP_KEY );
	const yBlocks = ymap.get( 'blocks' ) ?? new Y.Array< YBlock >();

	const isSelectionEmpty = Object.keys( selectionStart ).length === 0;
	const noSelection: SelectionNone = {
		type: SelectionType.None,
	};

	if ( isSelectionEmpty ) {
		// Case 1: No selection
		return noSelection;
	}

	// When the page initially loads, selectionStart can contain an empty object `{}`.
	const isSelectionInOneBlock =
		selectionStart.clientId === selectionEnd.clientId;
	const isCursorOnly =
		isSelectionInOneBlock && selectionStart.offset === selectionEnd.offset;
	const isSelectionAWholeBlock =
		isSelectionInOneBlock &&
		selectionStart.offset === undefined &&
		selectionEnd.offset === undefined;

	if ( isSelectionAWholeBlock ) {
		// Case 2: A whole block is selected.
		return {
			type: SelectionType.WholeBlock,
			blockId: selectionStart.clientId,
		};
	} else if ( isCursorOnly ) {
		// Case 3: Cursor only, no text selected
		const cursorPosition = getCursorPosition( selectionStart, yBlocks );

		if ( ! cursorPosition ) {
			// If we can't find the cursor position in block text, treat it as a non-selection.
			return noSelection;
		}

		return {
			type: SelectionType.Cursor,
			blockId: selectionStart.clientId,
			cursorPosition,
		};
	} else if ( isSelectionInOneBlock ) {
		// Case 4: Selection in a single block
		const cursorStartPosition = getCursorPosition(
			selectionStart,
			yBlocks
		);
		const cursorEndPosition = getCursorPosition( selectionEnd, yBlocks );

		if ( ! cursorStartPosition || ! cursorEndPosition ) {
			// If we can't find the cursor positions in block text, treat it as a non-selection.
			return noSelection;
		}

		return {
			type: SelectionType.SelectionInOneBlock,
			blockId: selectionStart.clientId,
			cursorStartPosition,
			cursorEndPosition,
		};
	}

	// Caes 5: Selection in multiple blocks
	const cursorStartPosition = getCursorPosition( selectionStart, yBlocks );
	const cursorEndPosition = getCursorPosition( selectionEnd, yBlocks );
	if ( ! cursorStartPosition || ! cursorEndPosition ) {
		// If we can't find the cursor positions in block text, treat it as a non-selection.
		return noSelection;
	}

	return {
		type: SelectionType.SelectionInMultipleBlocks,
		blockStartId: selectionStart.clientId,
		blockEndId: selectionEnd.clientId,
		cursorStartPosition,
		cursorEndPosition,
	};
}

/**
 * Get the cursor position from a selection.
 *
 * @param selection - The selection.
 * @param blocks    - The blocks to search through.
 * @return The cursor position, or null if not found.
 */
function getCursorPosition(
	selection: WPBlockSelection,
	blocks: YBlocks
): CursorPosition | null {
	const block = findBlockByClientId( selection.clientId, blocks );
	if (
		! block ||
		! selection.attributeKey ||
		undefined === selection.offset
	) {
		return null;
	}

	const attributes = block.get( 'attributes' );
	const currentYText = attributes?.get( selection.attributeKey ) as Y.Text;

	const relativePosition = Y.createRelativePositionFromTypeIndex(
		currentYText,
		selection.offset
	);

	return {
		relativePosition,
		absoluteOffset: selection.offset,
	};
}

/**
 * Find a block by its client ID.
 *
 * @param blockId - The client ID of the block.
 * @param blocks  - The blocks to search through.
 * @return The block if found, null otherwise.
 */
function findBlockByClientId(
	blockId: string,
	blocks: YBlocks
): YBlock | null {
	for ( const block of blocks ) {
		if ( block.get( 'clientId' ) === blockId ) {
			return block;
		}

		const innerBlocks = block.get( 'innerBlocks' );

		if ( innerBlocks && innerBlocks.length > 0 ) {
			const innerBlock = findBlockByClientId( blockId, innerBlocks );

			if ( innerBlock ) {
				return innerBlock;
			}
		}
	}

	return null;
}

/**
 * Check if two selection states are equal.
 *
 * @param selection1 - The first selection state.
 * @param selection2 - The second selection state.
 * @return True if the selection states are equal, false otherwise.
 */
export function areSelectionsStatesEqual(
	selection1: SelectionState,
	selection2: SelectionState
): boolean {
	if ( selection1.type !== selection2.type ) {
		return false;
	}

	switch ( selection1.type ) {
		case SelectionType.None:
			return true;

		case SelectionType.Cursor:
			return (
				selection1.blockId ===
					( selection2 as SelectionCursor ).blockId &&
				areCursorPositionsEqual(
					selection1.cursorPosition,
					( selection2 as SelectionCursor ).cursorPosition
				)
			);

		case SelectionType.SelectionInOneBlock:
			return (
				selection1.blockId ===
					( selection2 as SelectionInOneBlock ).blockId &&
				areCursorPositionsEqual(
					selection1.cursorStartPosition,
					( selection2 as SelectionInOneBlock ).cursorStartPosition
				) &&
				areCursorPositionsEqual(
					selection1.cursorEndPosition,
					( selection2 as SelectionInOneBlock ).cursorEndPosition
				)
			);

		case SelectionType.SelectionInMultipleBlocks:
			return (
				selection1.blockStartId ===
					( selection2 as SelectionInMultipleBlocks ).blockStartId &&
				selection1.blockEndId ===
					( selection2 as SelectionInMultipleBlocks ).blockEndId &&
				areCursorPositionsEqual(
					selection1.cursorStartPosition,
					( selection2 as SelectionInMultipleBlocks )
						.cursorStartPosition
				) &&
				areCursorPositionsEqual(
					selection1.cursorEndPosition,
					( selection2 as SelectionInMultipleBlocks )
						.cursorEndPosition
				)
			);
		case SelectionType.WholeBlock:
			return (
				selection1.blockId ===
				( selection2 as SelectionWholeBlock ).blockId
			);

		default:
			return false;
	}
}

/**
 * Check if two cursor positions are equal.
 *
 * @param cursorPosition1 - The first cursor position.
 * @param cursorPosition2 - The second cursor position.
 * @return True if the cursor positions are equal, false otherwise.
 */
function areCursorPositionsEqual(
	cursorPosition1: CursorPosition,
	cursorPosition2: CursorPosition
): boolean {
	const isRelativePositionEqual =
		JSON.stringify( cursorPosition1.relativePosition ) ===
		JSON.stringify( cursorPosition2.relativePosition );

	// Ensure a change in calculated absolute offset results in a treating the cursor as modified.
	// This is necessary because Y.Text relative positions can remain the same after text changes.
	const isAbsoluteOffsetEqual =
		cursorPosition1.absoluteOffset === cursorPosition2.absoluteOffset;

	return isRelativePositionEqual && isAbsoluteOffsetEqual;
}
