import {
	privateApis as coreDataPrivateApis,
	type SelectionCursor,
	SelectionType,
} from '@wordpress/core-data';
import { useEffect, useMemo, useState } from '@wordpress/element';

import { unlock } from '../../lock-unlock';
import { getAvatarUrl } from './get-avatar-url';
import { getAvatarBorderColor } from '../collab-sidebar/utils';

const { useActiveCollaborators, useGetAbsolutePositionIndex } =
	unlock( coreDataPrivateApis );

export interface CursorData {
	userName: string;
	clientId: number;
	color: string;
	avatarUrl?: string;
	x: number;
	y: number;
	height: number;
}

/**
 * Custom hook that computes cursor positions for each remote user in the editor.
 *
 * @param overlayElement      - The overlay element
 * @param blockEditorDocument - The block editor document
 * @param postId              - The ID of the post
 * @param postType            - The type of the post
 * @return An array of cursor data for rendering, and a function to trigger a delayed recompute.
 */
export function useRenderCursors(
	overlayElement: HTMLElement | null,
	blockEditorDocument: Document | null,
	postId: number | null,
	postType: string | null
): { cursors: CursorData[]; rerenderCursorsAfterDelay: () => () => void } {
	const sortedUsers = useActiveCollaborators(
		postId ?? null,
		postType ?? null
	);
	const getAbsolutePositionIndex = useGetAbsolutePositionIndex(
		postId ?? null,
		postType ?? null
	);

	const [ cursorPositions, setCursorPositions ] = useState< CursorData[] >(
		[]
	);

	const computeCursors = useMemo(
		() => () => {
			if ( ! overlayElement || ! blockEditorDocument ) {
				setCursorPositions( [] );
				return;
			}

			const results: CursorData[] = [];

			sortedUsers.forEach( ( user: any ) => {
				if ( user.isMe ) {
					return;
				}

				const selection = user.editorState?.selection ?? {
					type: SelectionType.None,
				};
				const userName = user.collaboratorInfo.name;
				const clientId = user.clientId;
				const color = getAvatarBorderColor( user.collaboratorInfo.id );
				const avatarUrl = getAvatarUrl(
					user.collaboratorInfo.avatar_urls
				);

				let coords: {
					x: number;
					y: number;
					height: number;
				} | null = null;

				if ( selection.type === SelectionType.None ) {
					// Nothing selected.
				} else if ( selection.type === SelectionType.WholeBlock ) {
					// Don't draw a cursor for a whole block selection.
				} else if ( selection.type === SelectionType.Cursor ) {
					coords = getCursorPosition(
						getAbsolutePositionIndex( selection ),
						selection.blockId,
						blockEditorDocument,
						overlayElement
					);
				} else if (
					selection.type === SelectionType.SelectionInOneBlock
				) {
					const selectionAsCursor: SelectionCursor = {
						type: SelectionType.Cursor,
						blockId: selection.blockId,
						cursorPosition: selection.cursorStartPosition,
					};
					coords = getCursorPosition(
						getAbsolutePositionIndex( selectionAsCursor ),
						selectionAsCursor.blockId,
						blockEditorDocument,
						overlayElement
					);
				} else if (
					selection.type === SelectionType.SelectionInMultipleBlocks
				) {
					const selectionAsCursor: SelectionCursor = {
						type: SelectionType.Cursor,
						blockId: selection.blockStartId,
						cursorPosition: selection.cursorStartPosition,
					};
					coords = getCursorPosition(
						getAbsolutePositionIndex( selectionAsCursor ),
						selectionAsCursor.blockId,
						blockEditorDocument,
						overlayElement
					);
				}

				if ( coords ) {
					results.push( {
						userName,
						clientId,
						color,
						avatarUrl,
						...coords,
					} );
				}
			} );

			setCursorPositions( results );
		},
		[
			blockEditorDocument,
			getAbsolutePositionIndex,
			overlayElement,
			sortedUsers,
		]
	);

	useEffect( computeCursors, [ computeCursors ] );

	const rerenderCursorsAfterDelay = useMemo(
		() => () => {
			const timeout = setTimeout( computeCursors, 500 );
			return () => clearTimeout( timeout );
		},
		[ computeCursors ]
	);

	return { cursors: cursorPositions, rerenderCursorsAfterDelay };
}

/**
 * Given a selection, returns the coordinates of the cursor in the block.
 *
 * @param absolutePositionIndex - The absolute position index
 * @param blockId               - The block ID
 * @param editorDocument        - The editor document
 * @param overlay               - The overlay element
 * @return The position of the cursor
 */
const getCursorPosition = (
	absolutePositionIndex: number | null,
	blockId: string,
	editorDocument: Document,
	overlay: HTMLElement
): { x: number; y: number; height: number } | null => {
	if ( absolutePositionIndex === null ) {
		// An absolute position index can be null if a cursor was set in a block that
		// has since been deleted.
		// Return null so we don't try to draw it.
		return null;
	}

	const blockElement = editorDocument.querySelector(
		`[data-block="${ blockId }"]`
	) as HTMLElement;

	if ( ! blockElement ) {
		return null;
	}

	return (
		getOffsetPositionInBlock(
			blockElement,
			absolutePositionIndex,
			editorDocument,
			overlay
		) ?? null
	);
};

/**
 * Given a block element and a character offset, returns the coordinates for drawing a visual cursor in the block.
 *
 * @param blockElement   - The block element
 * @param charOffset     - The character offset
 * @param editorDocument - The editor document
 * @param overlay        - The overlay element
 * @return The position of the cursor
 */
const getOffsetPositionInBlock = (
	blockElement: HTMLElement,
	charOffset: number,
	editorDocument: Document,
	overlay: HTMLElement
) => {
	const { node, offset } = findInnerBlockOffset(
		blockElement,
		charOffset,
		editorDocument
	);

	const cursorRange = editorDocument.createRange();

	try {
		cursorRange.setStart( node, offset );
	} catch ( error ) {
		return null;
	}

	// Ensure the range only represents single point in the DOM.
	cursorRange.collapse( true );

	const cursorRect = cursorRange.getBoundingClientRect();
	const overlayRect = overlay.getBoundingClientRect();
	const blockRect = blockElement.getBoundingClientRect();

	let cursorX = 0;
	let cursorY = 0;

	if (
		cursorRect.x === 0 &&
		cursorRect.y === 0 &&
		cursorRect.width === 0 &&
		cursorRect.height === 0
	) {
		// This can happen for empty blocks.
		cursorX = blockRect.left - overlayRect.left;
		cursorY = blockRect.top - overlayRect.top;
	} else {
		cursorX = cursorRect.left - overlayRect.left;
		cursorY = cursorRect.top - overlayRect.top;
	}

	let cursorHeight = cursorRect.height;
	if ( cursorHeight === 0 ) {
		cursorHeight =
			parseInt(
				window.getComputedStyle( blockElement ).lineHeight,
				10
			) || blockRect.height;
	}

	return {
		x: cursorX,
		y: cursorY,
		height: cursorHeight,
	};
};

const MAX_NODE_OFFSET_COUNT = 1000;

/**
 * Given a block element and a character offset, returns an exact inner node and offset for use in a range.
 *
 * @param blockElement   - The block element
 * @param offset         - The character offset
 * @param editorDocument - The editor document
 * @return The node and offset of the character at the offset
 */
const findInnerBlockOffset = (
	blockElement: HTMLElement,
	offset: number,
	editorDocument: Document
) => {
	const treeWalker = editorDocument.createTreeWalker(
		blockElement,
		NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT // eslint-disable-line no-bitwise
	);

	let currentOffset = 0;
	let lastTextNode: Node | null = null;

	let node: Node | null = null;
	let nodeCount = 1;

	while ( ( node = treeWalker.nextNode() ) ) {
		nodeCount++;

		if ( nodeCount > MAX_NODE_OFFSET_COUNT ) {
			// If we've walked too many nodes, return the last text node or the beginning of the block.
			if ( lastTextNode ) {
				return { node: lastTextNode, offset: 0 };
			}
			return { node: blockElement, offset: 0 };
		}

		const nodeLength = node.nodeValue?.length ?? 0;

		if ( node.nodeType === Node.ELEMENT_NODE ) {
			if ( node.nodeName === 'BR' ) {
				// Treat <br> as a single "\n" character.

				if ( currentOffset + 1 >= offset ) {
					// If the <br> occurs right on the target offset, return the next text node.
					const nodeAfterBr = treeWalker.nextNode();

					if ( nodeAfterBr?.nodeType === Node.TEXT_NODE ) {
						return { node: nodeAfterBr, offset: 0 };
					} else if ( lastTextNode ) {
						// If there's no text node after the <br>, return the end offset of the last text node.
						return {
							node: lastTextNode,
							offset: lastTextNode.nodeValue?.length ?? 0,
						};
					}
					// Just in case, if there's no last text node, return the beginning of the block.
					return { node: blockElement, offset: 0 };
				}

				// The <br> is before the target offset. Count it as a single character.
				currentOffset += 1;
				continue;
			} else {
				// Skip other element types.
				continue;
			}
		}

		if ( nodeLength === 0 ) {
			// Skip empty nodes.
			continue;
		}

		if ( currentOffset + nodeLength >= offset ) {
			// This node exceeds the target offset. Return the node and the position of the offset within it.
			return { node, offset: offset - currentOffset };
		}

		currentOffset += nodeLength;

		if ( node.nodeType === Node.TEXT_NODE ) {
			lastTextNode = node;
		}
	}

	if ( lastTextNode && lastTextNode.nodeValue?.length ) {
		// We didn't reach the target offset. Return the last text node's last character.
		return { node: lastTextNode, offset: lastTextNode.nodeValue.length };
	}

	// We didn't find any text nodes. Return the beginning of the block.
	return { node: blockElement, offset: 0 };
};
