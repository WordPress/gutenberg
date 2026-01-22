/**
 * External dependencies
 */
import type { Y, BaseState } from '@wordpress/sync';

export interface AnyFunction {
	( ...args: any[] ): any;
}

// Avoid a circular dependency with @wordpress/editor
export interface WPBlockSelection {
	clientId: string;
	attributeKey: string;
	offset: number;
}

export interface WPSelection {
	selectionEnd: WPBlockSelection;
	selectionStart: WPBlockSelection;
}

/**
 * Convenience types to manage block values with a clientId, attributes, and innerBlocks.
 */
export type BlockInnerBlocks = Y.Array< SelectableBlock >;
type BlockClientId = string;
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
 * The editor state includes information about the user's current selection.
 */
export interface EditorState {
	selection: SelectionState;
}

/**
 * The post editor state extends the base state with information used to render
 * presence indicators in the post editor.
 */
export interface PostEditorState extends BaseState {
	editorState?: EditorState;
}
