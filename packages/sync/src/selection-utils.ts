/**
 * External dependencies
 */
import type * as Y from 'yjs';

/**
 * Internal dependencies
 */
import type { EditorState } from './awareness/awareness-types';

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
 * Check if two selection states are equal.
 *
 * @param selection1 - The first selection state.
 * @param selection2 - The second selection state.
 * @return True if the selection states are equal, false otherwise.
 */
function areSelectionsEqual(
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
 * Check if two editor states are equal.
 *
 * @param state1 - The first editor state.
 * @param state2 - The second editor state.
 * @return True if the editor states are equal, false otherwise.
 */
export function areEditorStatesEqual(
	state1?: EditorState,
	state2?: EditorState
): boolean {
	if ( ! state1 || ! state2 ) {
		return state1 === state2;
	}

	return areSelectionsEqual( state1.selection, state2.selection );
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
