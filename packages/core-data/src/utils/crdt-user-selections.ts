/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data';
import { Y } from '@wordpress/sync';
// @ts-ignore No exported types for block editor store selectors.
import { store as blockEditorStore } from '@wordpress/block-editor';

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
 * Uses getBlockPathForLocalClientId to locate blocks in the Yjs document by
 * their tree position (index path) rather than clientId, since clientIds may
 * differ between the block-editor store and the Yjs document (e.g. in "Show
 * Template" mode).
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
	const yBlocks = ymap.get( 'blocks' );

	const isSelectionEmpty = Object.keys( selectionStart ).length === 0;
	const noSelection: SelectionNone = {
		type: SelectionType.None,
	};

	if ( isSelectionEmpty || ! yBlocks ) {
		// Case 1: No selection, or no blocks in the document.
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
		const path = getBlockPathForLocalClientId( selectionStart.clientId );
		const blockPosition = path
			? createRelativePositionForBlockPath( path, yBlocks )
			: null;

		if ( ! blockPosition ) {
			return noSelection;
		}

		return {
			type: SelectionType.WholeBlock,
			blockPosition,
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

	// Case 5: Selection in multiple blocks
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
	const path = getBlockPathForLocalClientId( selection.clientId );
	const block = path ? findBlockByPath( path, blocks ) : null;
	if (
		! block ||
		! selection.attributeKey ||
		undefined === selection.offset
	) {
		return null;
	}

	const attributes = block.get( 'attributes' );
	const currentYText = attributes?.get( selection.attributeKey );

	// If the attribute is not a Y.Text, return null.
	if ( ! ( currentYText instanceof Y.Text ) ) {
		return null;
	}

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
 * Resolves a local block-editor clientId to its index path relative to the
 * post content blocks. This allows finding the corresponding block in the Yjs
 * document even when clientIds differ (e.g. in "Show Template" mode where
 * blocks are cloned).
 *
 * In template mode, the block tree includes template parts and wrapper blocks
 * around a core/post-content block. The Yjs document only contains the post
 * content blocks, so we stop the upward walk when the parent is
 * core/post-content (its inner blocks correspond to the Yjs root blocks).
 *
 * @param clientId - The local block-editor clientId to resolve.
 * @return The index path from root, or null if not resolvable.
 */
export function getBlockPathForLocalClientId(
	clientId: string
): AbsoluteBlockIndexPath | null {
	const { getBlockIndex, getBlockRootClientId, getBlockName } =
		select( blockEditorStore );

	const path: AbsoluteBlockIndexPath = [];
	let current: string | null = clientId;
	while ( current ) {
		const index = getBlockIndex( current );
		if ( index === -1 ) {
			return null;
		}
		path.unshift( index );
		const parent = getBlockRootClientId( current );
		if ( ! parent ) {
			break;
		}
		// If the parent is core/post-content, stop here — the Yjs doc
		// root blocks correspond to post-content's inner blocks.
		const parentName = getBlockName( parent );
		if ( parentName === 'core/post-content' ) {
			break;
		}
		current = parent;
	}
	return path.length > 0 ? path : null;
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
 * Create a Y.RelativePosition for a block by navigating a tree index path.
 *
 * @param path   - The index path, e.g. [0, 1] for blocks[0].innerBlocks[1].
 * @param blocks - The root-level Yjs blocks array.
 * @return A Y.RelativePosition for the block, or null if the path is invalid.
 */
function createRelativePositionForBlockPath(
	path: AbsoluteBlockIndexPath,
	blocks: YBlocks
): Y.RelativePosition | null {
	let currentBlocks = blocks;
	for ( let i = 0; i < path.length; i++ ) {
		if ( path[ i ] >= currentBlocks.length ) {
			return null;
		}
		if ( i === path.length - 1 ) {
			return Y.createRelativePositionFromTypeIndex(
				currentBlocks,
				path[ i ]
			);
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
			return Y.compareRelativePositions(
				selection1.blockPosition,
				( selection2 as SelectionWholeBlock ).blockPosition
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
	const isRelativePositionEqual = Y.compareRelativePositions(
		cursorPosition1.relativePosition,
		cursorPosition2.relativePosition
	);

	// Ensure a change in calculated absolute offset results in a treating the cursor as modified.
	// This is necessary because Y.Text relative positions can remain the same after text changes.
	const isAbsoluteOffsetEqual =
		cursorPosition1.absoluteOffset === cursorPosition2.absoluteOffset;

	return isRelativePositionEqual && isAbsoluteOffsetEqual;
}
