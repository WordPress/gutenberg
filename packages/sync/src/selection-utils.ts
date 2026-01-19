/**
 * External dependencies
 */
import * as Y from 'yjs';

/**
 * Internal dependencies
 */
import type { EditorState } from './awareness/awareness-types';
import { type WPBlockSelection } from './awareness/awareness-types';
import type { RecordHandlers } from './types';

/**
 * Convenience types to manage block values with a clientId, attributes, and innerBlocks.
 */
type BlockClientId = string;
type BlockInnerBlocks = Y.Array< SelectableBlock >;
type BlockAttributes = Y.Map< Y.Text >;

/**
 * A block that can be selected.
 */
export type SelectableBlock = Y.Map<
	BlockClientId | BlockAttributes | BlockInnerBlocks
>;

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
 * @param yBlocks
 * @return The SelectionState
 */
export function getSelectionState(
	selectionStart: WPBlockSelection,
	selectionEnd: WPBlockSelection,
	yBlocks: Y.Array< SelectableBlock >
): SelectionState {
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
 * Update the entity record with the current user's selection.
 *
 * @param handlers        - Record handlers.
 * @param selectionStart  - The start position of the selection.
 * @param selectionEnd    - The end position of the selection.
 * @param initialPosition - The initial position of the selection.
 */
export async function updateSelectionInEntityRecord(
	handlers: RecordHandlers,
	selectionStart: WPBlockSelection,
	selectionEnd: WPBlockSelection,
	initialPosition: number | null
): Promise< void > {
	if ( ! selectionStart.clientId ) {
		return;
	}

	// Send an entityRecord `selection` update if we have a selection.
	//
	// Normally WordPress updates the `selection` property of the post when changes are made to blocks.
	// In a multi-user setup, block changes can occur from other users. When an entity is updated from another
	// user's changes, useBlockSync() in Gutenberg will reset the user's selection to the last saved selection.
	//
	// Manually adding an edit for each movement ensures that other user's changes to the document will
	// not cause the local user's selection to reset to the last local change location.
	const edits = {
		selection: { selectionStart, selectionEnd, initialPosition },
	};

	const options = {
		undoIgnore: true,
	};

	handlers.editRecord( edits, options );
}

export function getCursorPosition(
	selection: WPBlockSelection,
	blocks: Y.Array< SelectableBlock >
): CursorPosition | null {
	const block = findBlockByClientId( selection.clientId, blocks );
	if ( ! block ) {
		return null;
	}

	const attributes = block.get( 'attributes' ) as Y.Map< Y.Text >;
	const currentYText = attributes.get( selection.attributeKey ) as Y.Text;

	const relativePosition = Y.createRelativePositionFromTypeIndex(
		currentYText,
		selection.offset
	);

	return {
		relativePosition,
		absoluteOffset: selection.offset,
	};
}

function findBlockByClientId(
	blockId: string,
	blocks: Y.Array< SelectableBlock >
): SelectableBlock | null {
	for ( const block of blocks ) {
		if ( block.get( 'clientId' ) === blockId ) {
			return block;
		}

		const innerBlocks = block.get( 'innerBlocks' ) as BlockInnerBlocks;

		if ( innerBlocks.length > 0 ) {
			const innerBlock = findBlockByClientId(
				blockId,
				block.get( 'innerBlocks' ) as Y.Array< SelectableBlock >
			);

			if ( innerBlock ) {
				return innerBlock;
			}
		}
	}

	return null;
}

export function areSelectionsEqual(
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
			//logger.error( 'Unable to compare selection types:', selection1, selection2 );
			return false;
	}
}

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

export function areEditorStatesEqual(
	state1?: EditorState,
	state2?: EditorState
): boolean {
	if ( ! state1 || ! state2 ) {
		return state1 === state2;
	}

	return areSelectionsEqual( state1.selection, state2.selection );
}
