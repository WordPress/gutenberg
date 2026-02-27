/**
 * WordPress dependencies
 */
import type { Y } from '@wordpress/sync';

/**
 * Internal dependencies
 */
import type { SelectionType } from './utils/crdt-user-selections';

export interface AnyFunction {
	( ...args: any[] ): any;
}

/**
 * An index path from the root of the block tree to a specific block.
 *
 * For example, `[0, 1]` refers to `blocks[0].innerBlocks[1]`.
 *
 * These paths are "absolute" in that they start from the post content root
 * (not from the template root when "Show Template" mode is active).
 * Both the Yjs document and the block-editor store share the same tree
 * structure for post content blocks, so the same path can be used to
 * navigate either tree.
 */
export type AbsoluteBlockIndexPath = number[];

/**
 * Avoid a circular dependency with @wordpress/editor
 *
 * Additionaly, this type marks `attributeKey` and `offset` as possibly
 * `undefined`, which can happen in two known scenarios:
 *
 * 1. If a user has an entire block highlighted (e.g., a `core/image` block).
 * 2. If there's an intermediate selection state while inserting a block, those
 *    properties will be temporarily`undefined`.
 */
export interface WPBlockSelection {
	clientId: string;
	attributeKey?: string;
	offset?: number;
}

export interface WPSelection {
	selectionEnd: WPBlockSelection;
	selectionStart: WPBlockSelection;
	initialPosition?: number | null;
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
	// The block is derived on the receiver side by navigating up from the
	// resolved cursorPosition via Y.AbstractType.parent.
	type: SelectionType.Cursor;
	cursorPosition: CursorPosition;
};

export type SelectionInOneBlock = {
	// The user has highlighted text in a single block.
	// The block is derived on the receiver side by navigating up from the
	// resolved cursorStartPosition via Y.AbstractType.parent.
	type: SelectionType.SelectionInOneBlock;
	cursorStartPosition: CursorPosition;
	cursorEndPosition: CursorPosition;
};

export type SelectionInMultipleBlocks = {
	// The user has highlighted text over multiple blocks.
	// The blocks are derived on the receiver side by navigating up from the
	// resolved cursor positions via Y.AbstractType.parent.
	type: SelectionType.SelectionInMultipleBlocks;
	cursorStartPosition: CursorPosition;
	cursorEndPosition: CursorPosition;
};

export type SelectionWholeBlock = {
	// The user has a non-text block selected, like an image block.
	// Uses a Y.RelativePosition pointing to the block in its parent Y.Array,
	// since there is no text cursor to navigate up from.
	type: SelectionType.WholeBlock;
	blockPosition: Y.RelativePosition;
};

export type SelectionState =
	| SelectionNone
	| SelectionCursor
	| SelectionInOneBlock
	| SelectionInMultipleBlocks
	| SelectionWholeBlock;
