/**
 * WordPress dependencies
 */
import { Y } from '@wordpress/sync';

/**
 * Internal dependencies
 */
import { CRDT_RECORD_MAP_KEY } from '../sync';
import type { YPostRecord } from './crdt';
import type { YBlock, YBlocks } from './crdt-blocks';
import { getRootMap } from './crdt-utils';
import type {
	AbsoluteBlockIndexPath,
	WPBlockSelection,
	SelectionState,
	SelectionNone,
	SelectionCursor,
	SelectionInOneBlock,
	SelectionInMultipleBlocks,
	SelectionWholeBlock,
	CursorPosition,
} from '../types';

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
 * Converts WordPress block editor selection to a SelectionState.
 *
 * Uses a blockPathResolver to locate blocks in the Yjs document by their
 * tree position (index path) rather than clientId, since clientIds may differ
 * between the block-editor store and the Yjs document (e.g. in "Show Template" mode).
 *
 * @param selectionStart    - The start position of the selection
 * @param selectionEnd      - The end position of the selection
 * @param yDoc              - The Yjs document
 * @param blockPathResolver - Resolves a block clientId to its index path in the block tree
 * @return The SelectionState
 */
export function getSelectionState(
	selectionStart: WPBlockSelection,
	selectionEnd: WPBlockSelection,
	yDoc: Y.Doc,
	blockPathResolver: ( clientId: string ) => AbsoluteBlockIndexPath | null
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
		const path = blockPathResolver( selectionStart.clientId );
		const blockPos = path ? findBlockPositionByPath( path, yBlocks ) : null;

		if ( ! blockPos ) {
			return noSelection;
		}

		return {
			type: SelectionType.WholeBlock,
			blockPosition: Y.createRelativePositionFromTypeIndex(
				blockPos.parentArray,
				blockPos.index
			),
		};
	} else if ( isCursorOnly ) {
		// Case 3: Cursor only, no text selected
		const cursorPosition = getCursorPosition(
			selectionStart,
			yBlocks,
			blockPathResolver
		);

		if ( ! cursorPosition ) {
			// If we can't find the cursor position in block text, treat it as a non-selection.
			return noSelection;
		}

		return {
			type: SelectionType.Cursor,
			cursorPosition,
		};
	} else if ( isSelectionInOneBlock ) {
		// Case 4: Selection in a single block
		const cursorStartPosition = getCursorPosition(
			selectionStart,
			yBlocks,
			blockPathResolver
		);
		const cursorEndPosition = getCursorPosition(
			selectionEnd,
			yBlocks,
			blockPathResolver
		);

		if ( ! cursorStartPosition || ! cursorEndPosition ) {
			// If we can't find the cursor positions in block text, treat it as a non-selection.
			return noSelection;
		}

		return {
			type: SelectionType.SelectionInOneBlock,
			cursorStartPosition,
			cursorEndPosition,
		};
	}

	// Case 5: Selection in multiple blocks
	const cursorStartPosition = getCursorPosition(
		selectionStart,
		yBlocks,
		blockPathResolver
	);
	const cursorEndPosition = getCursorPosition(
		selectionEnd,
		yBlocks,
		blockPathResolver
	);
	if ( ! cursorStartPosition || ! cursorEndPosition ) {
		// If we can't find the cursor positions in block text, treat it as a non-selection.
		return noSelection;
	}

	return {
		type: SelectionType.SelectionInMultipleBlocks,
		cursorStartPosition,
		cursorEndPosition,
	};
}

/**
 * Get the cursor position from a selection.
 *
 * @param selection         - The selection.
 * @param blocks            - The blocks to search through.
 * @param blockPathResolver - Resolves a block clientId to its index path in the block tree.
 * @return The cursor position, or null if not found.
 */
function getCursorPosition(
	selection: WPBlockSelection,
	blocks: YBlocks,
	blockPathResolver: ( clientId: string ) => AbsoluteBlockIndexPath | null
): CursorPosition | null {
	const path = blockPathResolver( selection.clientId );
	const block = path ? findBlockByPath( path, blocks ) : null;
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
 * Find a block by navigating a tree index path in the Yjs block hierarchy.
 *
 * @param path   - The index path, e.g. [0, 1] for blocks[0].innerBlocks[1].
 * @param blocks - The root-level Yjs blocks array.
 * @return The block Y.Map if found, null otherwise.
 */
function findBlockByPath(
	path: AbsoluteBlockIndexPath,
	blocks: YBlocks
): YBlock | null {
	let currentBlocks = blocks;
	for ( let i = 0; i < path.length; i++ ) {
		if ( path[ i ] >= currentBlocks.length ) {
			return null;
		}
		const block = currentBlocks.get( path[ i ] );
		if ( ! block ) {
			return null;
		}
		if ( i === path.length - 1 ) {
			return block;
		}
		currentBlocks =
			block.get( 'innerBlocks' ) ?? ( new Y.Array() as YBlocks );
	}
	return null;
}

/**
 * Find a block's position (parent array and index) by navigating a tree index path.
 * Used for WholeBlock selections where we need to create a Y.RelativePosition.
 *
 * @param path   - The index path, e.g. [0, 1] for blocks[0].innerBlocks[1].
 * @param blocks - The root-level Yjs blocks array.
 * @return The parent array and index if found, null otherwise.
 */
function findBlockPositionByPath(
	path: AbsoluteBlockIndexPath,
	blocks: YBlocks
): { parentArray: YBlocks; index: number } | null {
	let currentBlocks = blocks;
	for ( let i = 0; i < path.length; i++ ) {
		if ( path[ i ] >= currentBlocks.length ) {
			return null;
		}
		if ( i === path.length - 1 ) {
			return { parentArray: currentBlocks, index: path[ i ] };
		}
		const block = currentBlocks.get( path[ i ] );
		currentBlocks =
			block?.get( 'innerBlocks' ) ?? ( new Y.Array() as YBlocks );
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
			return areCursorPositionsEqual(
				selection1.cursorPosition,
				( selection2 as SelectionCursor ).cursorPosition
			);

		case SelectionType.SelectionInOneBlock:
			return (
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
				JSON.stringify( selection1.blockPosition ) ===
				JSON.stringify(
					( selection2 as SelectionWholeBlock ).blockPosition
				)
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
