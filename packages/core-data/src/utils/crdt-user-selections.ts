/**
 * WordPress dependencies
 */
import { dispatch, select, subscribe } from '@wordpress/data';
import {
	Y,
	LOCAL_CURSOR_UPDATE_DEBOUNCE_IN_MS,
	CRDT_RECORD_MAP_KEY,
} from '@wordpress/sync';
// @ts-ignore No exported types for block editor store selectors.
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { STORE_NAME } from '../name';
import { type WPBlockSelection } from '../types';

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
 * Subscribe to user selection changes and update the selection state.
 *
 * @param kind              - The kind of entity.
 * @param name              - The name of the entity.
 * @param recordId          - The ID of the entity.
 * @param yDoc              - Y.Doc
 * @param setSelectionState - The function to set the selection state.
 */
export function subscribeToUserSelectionChanges(
	kind: string,
	name: string,
	recordId: string | number,
	yDoc: Y.Doc,
	setSelectionState: ( selectionState: SelectionState ) => void
): void {
	const {
		getSelectionStart,
		getSelectionEnd,
		getSelectedBlocksInitialCaretPosition,
	} = select( blockEditorStore );

	// Keep track of the current selection in the outer scope so we can compare
	// in the subscription.
	let selectionStart = getSelectionStart();
	let selectionEnd = getSelectionEnd();
	let localCursorTimeout: NodeJS.Timeout | null = null;

	subscribe( () => {
		const newSelectionStart = getSelectionStart();
		const newSelectionEnd = getSelectionEnd();

		if (
			newSelectionStart === selectionStart &&
			newSelectionEnd === selectionEnd
		) {
			return;
		}

		selectionStart = newSelectionStart;
		selectionEnd = newSelectionEnd;

		// Typically selection position is only persisted after typing in a block, which
		// can cause selection position to be reset by other users making block updates.
		// Ensure we update the controlled selection right away, persisting our cursor position locally.
		const initialPosition = getSelectedBlocksInitialCaretPosition();
		void updateSelectionInEntityRecord(
			kind,
			name,
			recordId,
			selectionStart,
			selectionEnd,
			initialPosition
		);

		// We receive two selection changes in quick succession
		// from local selection events:
		//   { clientId: "123...", attributeKey: "content", offset: undefined }
		//   { clientId: "123...", attributeKey: "content", offset: 554 }
		// Add a short debounce to avoid sending the first selection change.
		if ( localCursorTimeout ) {
			clearTimeout( localCursorTimeout );
		}

		localCursorTimeout = setTimeout( () => {
			const selectionState = getSelectionState(
				selectionStart,
				selectionEnd,
				yDoc
			);
			setSelectionState( selectionState );
		}, LOCAL_CURSOR_UPDATE_DEBOUNCE_IN_MS );
	} );
}

/**
 * Converts WordPress block editor selection to a SelectionState.
 *
 * @param selectionStart - The start position of the selection
 * @param selectionEnd   - The end position of the selection
 * @param yDoc           - The Yjs document
 * @return The SelectionState
 */
function getSelectionState(
	selectionStart: WPBlockSelection,
	selectionEnd: WPBlockSelection,
	yDoc: Y.Doc
): SelectionState {
	const ydoc = yDoc.getMap( CRDT_RECORD_MAP_KEY );
	const yBlocks = ydoc.get( 'blocks' ) as Y.Array< SelectableBlock >;

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
 * @param kind            - The kind of entity.
 * @param name            - The name of the entity.
 * @param recordId        - The ID of the entity.
 * @param selectionStart  - The start position of the selection.
 * @param selectionEnd    - The end position of the selection.
 * @param initialPosition - The initial position of the selection.
 */
export async function updateSelectionInEntityRecord(
	kind: string,
	name: string,
	recordId: string | number,
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

	// @ts-ignore - Using STORE_NAME to avoid a circular dependency in the tests.
	dispatch( STORE_NAME ).editEntityRecord(
		kind,
		name,
		recordId,
		edits,
		options
	);
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

/**
 * Find a block by its client ID.
 *
 * @param blockId - The client ID of the block.
 * @param blocks  - The blocks to search through.
 * @return The block if found, null otherwise.
 */
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
