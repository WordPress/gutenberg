import {
	privateApis as coreDataPrivateApis,
	type SelectionCursor,
	type SelectionState,
	SelectionType,
} from '@wordpress/core-data';
import { type RefObject, useEffect, useMemo } from '@wordpress/element';

import { type CursorRegistry } from './cursor-registry';
import { unlock } from '../../lock-unlock';

const { useActiveCollaborators, useGetAbsolutePositionIndex } =
	unlock( coreDataPrivateApis );

type RenderCursorsFunction = () => void;

/**
 * Custom hook for rendering cursors for each user in the editor.
 *
 * @param overlayRef          - The reference to the overlay element
 * @param blockEditorDocument - The block editor document
 * @param cursorRegistry      - The cursor registry
 * @param postId              - The ID of the post
 * @param postType            - The type of the post
 * @return A cursor render function. Can be used by parent to redraw cursors as needed.
 */
export function useRenderCursors(
	overlayRef: RefObject< HTMLElement | null >,
	blockEditorDocument: Document | null,
	cursorRegistry: CursorRegistry,
	postId: number | null,
	postType: string | null
) {
	const sortedUsers = useActiveCollaborators(
		postId ?? null,
		postType ?? null
	);
	const getAbsolutePositionIndex = useGetAbsolutePositionIndex(
		postId ?? null,
		postType ?? null
	);

	const renderCursors = useMemo< RenderCursorsFunction >(
		() => (): void => {
			if ( ! overlayRef.current || ! blockEditorDocument ) {
				return;
			}

			const userSelections = sortedUsers.map( ( user: any ) => ( {
				userName: user.collaboratorInfo.name,
				clientId: user.clientId,
				// Replace local user's selection with the current selection from the editor state.
				selection: user.editorState?.selection ?? {
					type: SelectionType.None,
				},
				color: user.collaboratorInfo.color,
				isMe: user.isMe,
			} ) );

			drawUserSelections(
				overlayRef.current,
				blockEditorDocument,
				userSelections,
				cursorRegistry,
				getAbsolutePositionIndex
			);
		},
		[
			blockEditorDocument,
			cursorRegistry,
			getAbsolutePositionIndex,
			overlayRef,
			sortedUsers,
		]
	);

	useEffect( renderCursors, [ renderCursors, sortedUsers ] );

	// Return function so that it can be called manually.
	return () => {
		const timeout = setTimeout( renderCursors, 500 );

		return () => clearTimeout( timeout );
	};
}

/**
 * Draws user selections on the overlay.
 *
 * @param overlay                  - The overlay element
 * @param editorDocument           - The editor document
 * @param userSelections           - The user selections
 * @param cursorRegistry           - The cursor registry
 * @param getAbsolutePositionIndex - The function to get the absolute position index
 */
const drawUserSelections = (
	overlay: HTMLElement | null,
	editorDocument: Document | null,
	userSelections: {
		userName: string;
		clientId: number;
		selection: SelectionState;
		color: string;
		isMe: boolean;
	}[],
	cursorRegistry: CursorRegistry,
	getAbsolutePositionIndex: ( selection: SelectionCursor ) => number | null
) => {
	if ( ! overlay || ! editorDocument ) {
		return;
	}

	// Clear up previous state
	cursorRegistry.removeAll();

	userSelections.forEach(
		( { userName, clientId, selection, color, isMe } ) => {
			if ( isMe ) {
				// Skip drawing the local user's cursor.
				return;
			}

			let coords: { x: number; y: number; height: number } | null = null;

			if ( selection.type === SelectionType.None ) {
				// Nothing selected.
			} else if ( selection.type === SelectionType.WholeBlock ) {
				// Don't draw a cursor for a whole block selection.
			} else if ( selection.type === SelectionType.Cursor ) {
				coords = getCursorPosition(
					getAbsolutePositionIndex( selection ),
					selection.blockId,
					editorDocument,
					overlay
				);
			} else if ( selection.type === SelectionType.SelectionInOneBlock ) {
				// Until selection logic is implemented, render a selection as a cursor at the beginning of the selection.
				const selectionAsCursor: SelectionCursor = {
					type: SelectionType.Cursor,
					blockId: selection.blockId,
					cursorPosition: selection.cursorStartPosition,
				};

				coords = getCursorPosition(
					getAbsolutePositionIndex( selectionAsCursor ),
					selectionAsCursor.blockId,
					editorDocument,
					overlay
				);
			} else if (
				selection.type === SelectionType.SelectionInMultipleBlocks
			) {
				// Until selection logic is implemented, render a selection as a cursor at the beginning of the selection.
				const selectionAsCursor: SelectionCursor = {
					type: SelectionType.Cursor,
					blockId: selection.blockStartId,
					cursorPosition: selection.cursorStartPosition,
				};

				coords = getCursorPosition(
					getAbsolutePositionIndex( selectionAsCursor ),
					selectionAsCursor.blockId,
					editorDocument,
					overlay
				);
			}

			if ( coords ) {
				// Create parent container
				// Use `document` instead of `editorDocument` because the overlay is in the parent document.
				const userContainer = document.createElement( 'div' );
				userContainer.className = 'collaborators-overlay-user';
				userContainer.style.left = `${ coords.x }px`;
				userContainer.style.top = `${ coords.y }px`;

				// Create cursor element
				const cursor = document.createElement( 'div' );
				cursor.className = 'collaborators-overlay-user-cursor';
				cursor.style.backgroundColor = color;
				cursor.style.height = `${ coords.height }px`;

				// Create label
				const label = document.createElement( 'div' );
				label.className = 'collaborators-overlay-user-label';
				label.textContent = userName;
				label.style.backgroundColor = color;

				// Append cursor and label to the container
				userContainer.appendChild( cursor );
				userContainer.appendChild( label );

				overlay.appendChild( userContainer );

				// Register cursor in the registry
				cursorRegistry.registerCursor( clientId, userContainer );
			}
		}
	);
};

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

	const coords = getOffsetPositionInBlock(
		blockElement,
		absolutePositionIndex,
		editorDocument,
		overlay
	);

	return coords ?? null;
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
