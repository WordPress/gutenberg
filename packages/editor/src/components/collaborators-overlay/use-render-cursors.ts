import {
	privateApis as coreDataPrivateApis,
	SelectionDirection,
	SelectionType,
} from '@wordpress/core-data';
import { useEffect, useMemo, useState } from '@wordpress/element';

import { unlock } from '../../lock-unlock';
import { getAvatarUrl } from './get-avatar-url';
import { getAvatarBorderColor } from '../collab-sidebar/utils';

const { useActiveCollaborators, useResolvedSelection } =
	unlock( coreDataPrivateApis );

export interface SelectionRect {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface CursorData {
	userName: string;
	clientId: number;
	color: string;
	avatarUrl?: string;
	x: number;
	y: number;
	height: number;
	selectionRects?: SelectionRect[];
}

interface CursorCoords {
	x: number;
	y: number;
	height: number;
}

/** Common parameters passed to cursor/selection computation helpers. */
interface CursorContext {
	editorDocument: Document;
	overlay: HTMLElement;
}

/** Resolved selection endpoint returned by resolveSelection(). */
interface ResolvedEndpoint {
	textIndex: number | null;
	localClientId: string | null;
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
	const resolveSelection = useResolvedSelection(
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

			const cursorContext: CursorContext = {
				editorDocument: blockEditorDocument,
				overlay: overlayElement,
			};

			const cursors: CursorData[] = [];

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

				const selectionVisual = computeSelectionVisual(
					selection,
					resolveSelection,
					cursorContext
				);

				if ( selectionVisual.coords ) {
					const cursorData: CursorData = {
						userName,
						clientId,
						color,
						avatarUrl,
						...selectionVisual.coords,
					};

					if ( selectionVisual.selectionRects ) {
						cursorData.selectionRects =
							selectionVisual.selectionRects;
					}

					cursors.push( cursorData );
				}
			} );

			setCursorPositions( cursors );
		},
		[ blockEditorDocument, resolveSelection, overlayElement, sortedUsers ]
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
 * Compute cursor coords and optional selection rects for a single user's selection.
 *
 * @param selection        - The selection state from the awareness layer.
 * @param resolveSelection - Resolves a SelectionState to a text index + block clientId.
 * @param cursorContext    - Shared editor document / overlay references.
 * @return Cursor coordinates and optional selection rectangles.
 */
function computeSelectionVisual(
	selection: any,
	resolveSelection: ( sel: any ) => ResolvedEndpoint,
	cursorContext: CursorContext
): { coords: CursorCoords | null; selectionRects?: SelectionRect[] } {
	if (
		selection.type === SelectionType.None ||
		selection.type === SelectionType.WholeBlock
	) {
		return { coords: null };
	}

	if ( selection.type === SelectionType.Cursor ) {
		return computeCursorOnly( selection, resolveSelection, cursorContext );
	}

	// SelectionInOneBlock or SelectionInMultipleBlocks.
	return computeTextSelection( selection, resolveSelection, cursorContext );
}

/**
 * Compute cursor coordinates for a simple cursor (no highlighted text).
 *
 * @param selection        - The selection state.
 * @param resolveSelection - Resolves a SelectionState to a text index + block clientId.
 * @param cursorContext    - Shared editor document / overlay references.
 * @return Cursor coordinates.
 */
function computeCursorOnly(
	selection: any,
	resolveSelection: ( sel: any ) => ResolvedEndpoint,
	cursorContext: CursorContext
): { coords: CursorCoords | null } {
	const { textIndex, localClientId } = resolveSelection( selection );
	if ( ! localClientId ) {
		return { coords: null };
	}
	return {
		coords: getCursorPosition(
			textIndex,
			localClientId,
			cursorContext.editorDocument,
			cursorContext.overlay
		),
	};
}

/**
 * Compute cursor coordinates and selection highlight rects for a text selection
 * (single-block or multi-block).
 *
 * @param selection        - The selection state.
 * @param resolveSelection - Resolves a SelectionState to a text index + block clientId.
 * @param cursorContext    - Shared editor document / overlay references.
 * @return Cursor coordinates and optional selection rectangles.
 */
function computeTextSelection(
	selection: any,
	resolveSelection: ( sel: any ) => ResolvedEndpoint,
	cursorContext: CursorContext
): { coords: CursorCoords | null; selectionRects?: SelectionRect[] } {
	const start = resolveSelection( {
		type: SelectionType.Cursor,
		cursorPosition: selection.cursorStartPosition,
	} );
	const end = resolveSelection( {
		type: SelectionType.Cursor,
		cursorPosition: selection.cursorEndPosition,
	} );

	if (
		! start.localClientId ||
		! end.localClientId ||
		start.textIndex === null ||
		end.textIndex === null
	) {
		return { coords: null };
	}

	const allRects =
		selection.type === SelectionType.SelectionInOneBlock
			? computeSingleBlockRects( start, end, cursorContext )
			: computeMultiBlockRects( start, end, cursorContext );

	if ( allRects.length > 0 ) {
		// Place the cursor at the active end of the selection —
		// backward means the caret sits at the start.
		const isReverse =
			selection.selectionDirection === SelectionDirection.Backward;
		const activeEnd = isReverse ? start : end;

		return {
			coords: getCursorPosition(
				activeEnd.textIndex,
				activeEnd.localClientId!,
				cursorContext.editorDocument,
				cursorContext.overlay
			),
			selectionRects: allRects,
		};
	}

	// Fallback: cursor at start position only.
	return {
		coords: getCursorPosition(
			start.textIndex,
			start.localClientId!,
			cursorContext.editorDocument,
			cursorContext.overlay
		),
	};
}

/**
 * Compute selection rects for a selection within a single block.
 *
 * @param start         - Resolved start endpoint.
 * @param end           - Resolved end endpoint.
 * @param cursorContext - Shared editor document / overlay references.
 * @return Array of selection rectangles.
 */
function computeSingleBlockRects(
	start: ResolvedEndpoint,
	end: ResolvedEndpoint,
	cursorContext: CursorContext
): SelectionRect[] {
	const blockElement =
		cursorContext.editorDocument.querySelector< HTMLElement >(
			`[data-block="${ start.localClientId }"]`
		);
	if ( ! blockElement ) {
		return [];
	}
	return (
		getSelectionRects(
			blockElement,
			start.textIndex!,
			end.textIndex!,
			cursorContext.editorDocument,
			cursorContext.overlay
		) ?? []
	);
}

/**
 * Compute selection rects for a selection spanning multiple blocks.
 *
 * Normalizes to document order — for backward selections the block editor
 * reports start after end.
 *
 * @param start         - Resolved start endpoint.
 * @param end           - Resolved end endpoint.
 * @param cursorContext - Shared editor document / overlay references.
 * @return Array of selection rectangles.
 */
function computeMultiBlockRects(
	start: ResolvedEndpoint,
	end: ResolvedEndpoint,
	cursorContext: CursorContext
): SelectionRect[] {
	let docFirst = start;
	let docLast = end;
	let firstBlock = cursorContext.editorDocument.querySelector< HTMLElement >(
		`[data-block="${ docFirst.localClientId }"]`
	);
	let lastBlock = cursorContext.editorDocument.querySelector< HTMLElement >(
		`[data-block="${ docLast.localClientId }"]`
	);

	// Swap to document order if needed.
	if ( firstBlock && lastBlock && isNodeBefore( lastBlock, firstBlock ) ) {
		docFirst = end;
		docLast = start;
		[ firstBlock, lastBlock ] = [ lastBlock, firstBlock ];
	}

	if ( ! firstBlock || ! lastBlock ) {
		return [];
	}

	const allRects: SelectionRect[] = [];

	// First block: from start offset to end of block.
	const startRects = getSelectionRects(
		firstBlock,
		docFirst.textIndex!,
		Number.MAX_SAFE_INTEGER,
		cursorContext.editorDocument,
		cursorContext.overlay
	);
	if ( startRects ) {
		allRects.push( ...startRects );
	}

	// Intermediate blocks: full content.
	const intermediateBlocks = getBlocksBetween(
		docFirst.localClientId!,
		docLast.localClientId!,
		cursorContext.editorDocument
	);
	for ( const intermediateBlock of intermediateBlocks ) {
		const rects = getFullBlockSelectionRects(
			intermediateBlock,
			cursorContext.editorDocument,
			cursorContext.overlay
		);
		allRects.push( ...rects );
	}

	// Last block: from 0 to end offset.
	const endRects = getSelectionRects(
		lastBlock,
		0,
		docLast.textIndex!,
		cursorContext.editorDocument,
		cursorContext.overlay
	);
	if ( endRects ) {
		allRects.push( ...endRects );
	}

	return allRects;
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
): CursorCoords | null => {
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

/**
 * Computes selection highlight rectangles for a text range within a single block.
 *
 * @param blockElement   - The block element
 * @param startOffset    - Start character offset within the block
 * @param endOffset      - End character offset within the block
 * @param editorDocument - The editor document
 * @param overlay        - The overlay element for coordinate conversion
 * @return Array of selection rectangles relative to the overlay, or null on failure
 */
const getSelectionRects = (
	blockElement: HTMLElement,
	startOffset: number,
	endOffset: number,
	editorDocument: Document,
	overlay: HTMLElement
): SelectionRect[] | null => {
	// Normalize direction.
	let normalizedStart = startOffset;
	let normalizedEnd = endOffset;
	if ( normalizedStart > normalizedEnd ) {
		[ normalizedStart, normalizedEnd ] = [ normalizedEnd, normalizedStart ];
	}

	const startPos = findInnerBlockOffset(
		blockElement,
		normalizedStart,
		editorDocument
	);
	const endPos = findInnerBlockOffset(
		blockElement,
		normalizedEnd,
		editorDocument
	);

	const range = editorDocument.createRange();
	try {
		range.setStart( startPos.node, startPos.offset );
		range.setEnd( endPos.node, endPos.offset );
	} catch {
		return null;
	}

	const overlayRect = overlay.getBoundingClientRect();
	const clientRects = range.getClientRects();
	const rects: SelectionRect[] = [];

	for ( const rect of clientRects ) {
		if ( rect.width === 0 && rect.height === 0 ) {
			continue;
		}
		rects.push( {
			x: rect.left - overlayRect.left,
			y: rect.top - overlayRect.top,
			width: rect.width,
			height: rect.height,
		} );
	}

	return rects.length > 0 ? rects : null;
};

/**
 * Computes selection highlight rectangles for the full content of a block.
 * Used for intermediate blocks in a multi-block selection.
 *
 * @param blockElement   - The block element
 * @param editorDocument - The editor document
 * @param overlay        - The overlay element
 * @return Array of selection rectangles relative to the overlay
 */
const getFullBlockSelectionRects = (
	blockElement: HTMLElement,
	editorDocument: Document,
	overlay: HTMLElement
): SelectionRect[] => {
	const range = editorDocument.createRange();
	range.selectNodeContents( blockElement );

	const overlayRect = overlay.getBoundingClientRect();
	const clientRects = range.getClientRects();
	const rects: SelectionRect[] = [];

	for ( const rect of clientRects ) {
		if ( rect.width === 0 && rect.height === 0 ) {
			continue;
		}
		rects.push( {
			x: rect.left - overlayRect.left,
			y: rect.top - overlayRect.top,
			width: rect.width,
			height: rect.height,
		} );
	}

	// Fallback: if getClientRects returned nothing, use the block's bounding rect.
	if ( rects.length === 0 ) {
		const blockRect = blockElement.getBoundingClientRect();
		if ( blockRect.width > 0 && blockRect.height > 0 ) {
			rects.push( {
				x: blockRect.left - overlayRect.left,
				y: blockRect.top - overlayRect.top,
				width: blockRect.width,
				height: blockRect.height,
			} );
		}
	}

	return rects;
};

/**
 * Finds all block elements between two blocks in DOM order (exclusive of start and end).
 *
 * @param startBlockId   - The clientId of the start block
 * @param endBlockId     - The clientId of the end block
 * @param editorDocument - The editor document
 * @return Array of intermediate block HTMLElements in document order
 */
const getBlocksBetween = (
	startBlockId: string,
	endBlockId: string,
	editorDocument: Document
): HTMLElement[] => {
	const allBlocks =
		editorDocument.querySelectorAll< HTMLElement >( '[data-block]' );

	let startIndex = -1;
	let endIndex = -1;

	for ( let i = 0; i < allBlocks.length; i++ ) {
		const blockId = allBlocks[ i ].getAttribute( 'data-block' );
		if ( blockId === startBlockId ) {
			startIndex = i;
		}
		if ( blockId === endBlockId ) {
			endIndex = i;
		}
	}

	if ( startIndex === -1 || endIndex === -1 ) {
		return [];
	}

	// Normalize order.
	if ( startIndex > endIndex ) {
		[ startIndex, endIndex ] = [ endIndex, startIndex ];
	}

	const result: HTMLElement[] = [];
	for ( let i = startIndex + 1; i < endIndex; i++ ) {
		result.push( allBlocks[ i ] );
	}
	return result;
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

/**
 * Check if node `a` precedes node `b` in document order.
 *
 * @param a - First node.
 * @param b - Second node.
 * @return True if `a` comes before `b`.
 */
const isNodeBefore = ( a: Node, b: Node ): boolean =>
	a.compareDocumentPosition( b ) === Node.DOCUMENT_POSITION_FOLLOWING;
