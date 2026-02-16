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
		const blockPos = findBlockPositionByClientId(
			selectionStart.clientId,
			yBlocks
		);

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
		const cursorPosition = getCursorPosition( selectionStart, yBlocks );

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
			yBlocks
		);
		const cursorEndPosition = getCursorPosition( selectionEnd, yBlocks );

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

	// Caes 5: Selection in multiple blocks
	const cursorStartPosition = getCursorPosition( selectionStart, yBlocks );
	const cursorEndPosition = getCursorPosition( selectionEnd, yBlocks );
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
 * Find a block's position (parent array and index) by its client ID.
 * Used for WholeBlock selections where we need to create a Y.RelativePosition.
 *
 * @param blockId - The client ID of the block.
 * @param blocks  - The blocks to search through.
 * @return The parent array and index if found, null otherwise.
 */
function findBlockPositionByClientId(
	blockId: string,
	blocks: YBlocks
): { parentArray: YBlocks; index: number } | null {
	for ( let i = 0; i < blocks.length; i++ ) {
		const block = blocks.get( i );
		if ( block.get( 'clientId' ) === blockId ) {
			return { parentArray: blocks, index: i };
		}

		const innerBlocks = block.get( 'innerBlocks' );

		if ( innerBlocks && innerBlocks.length > 0 ) {
			const result = findBlockPositionByClientId( blockId, innerBlocks );

			if ( result ) {
				return result;
			}
		}
	}

	return null;
}

/**
 * Resolve a block's Y.RelativePosition to a local client ID.
 * Used on the receiver side to find which block a WholeBlock selection refers to.
 *
 * @param blockPosition - The relative position of the block in its parent Y.Array.
 * @param yDoc          - The Yjs document.
 * @return The block's local client ID, or null if not found.
 */
export function resolveBlockClientId(
	blockPosition: Y.RelativePosition,
	yDoc: Y.Doc
): string | null {
	const absolutePos = Y.createAbsolutePositionFromRelativePosition(
		blockPosition,
		yDoc
	);

	if ( ! absolutePos ) {
		return null;
	}

	const parentArray = absolutePos.type as Y.Array< YBlock >;

	if ( ! ( parentArray instanceof Y.Array ) ) {
		return null;
	}

	const block = parentArray.get( absolutePos.index );
	if ( ! block ) {
		return null;
	}

	return ( block.get( 'clientId' ) as string ) ?? null;
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
