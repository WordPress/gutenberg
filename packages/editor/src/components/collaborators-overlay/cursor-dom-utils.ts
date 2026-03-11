export interface SelectionRect {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface CursorCoords {
	x: number;
	y: number;
	height: number;
}

const MAX_NODE_OFFSET_COUNT = 500;

/**
 * Given a selection, returns the coordinates of the cursor in the block.
 *
 * @param absolutePositionIndex - The absolute position index
 * @param blockElement          - The block element (or null if deleted)
 * @param editorDocument        - The editor document
 * @param overlayRect           - Pre-computed bounding rect of the overlay element
 * @return The position of the cursor
 */
export const getCursorPosition = (
	absolutePositionIndex: number | null,
	blockElement: HTMLElement | null,
	editorDocument: Document,
	overlayRect: DOMRect
): CursorCoords | null => {
	if ( absolutePositionIndex === null || ! blockElement ) {
		return null;
	}

	return (
		getOffsetPositionInBlock(
			blockElement,
			absolutePositionIndex,
			editorDocument,
			overlayRect
		) ?? null
	);
};

/**
 * Given a block element and a character offset, returns the coordinates for drawing a visual cursor in the block.
 *
 * @param blockElement   - The block element
 * @param charOffset     - The character offset
 * @param editorDocument - The editor document
 * @param overlayRect    - Pre-computed bounding rect of the overlay element
 * @return The position of the cursor
 */
const getOffsetPositionInBlock = (
	blockElement: HTMLElement,
	charOffset: number,
	editorDocument: Document,
	overlayRect: DOMRect
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
		const view = editorDocument.defaultView ?? window;
		cursorHeight =
			parseInt( view.getComputedStyle( blockElement ).lineHeight, 10 ) ||
			blockRect.height;
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
 * @param overlayRect    - Pre-computed bounding rect of the overlay element
 * @return Array of selection rectangles relative to the overlay, or null on failure
 */
export const getSelectionRects = (
	blockElement: HTMLElement,
	startOffset: number,
	endOffset: number,
	editorDocument: Document,
	overlayRect: DOMRect
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

	const clientRects = range.getClientRects();
	const rects: SelectionRect[] = [];

	for ( const rect of clientRects ) {
		if ( rect.width === 0 && rect.height === 0 ) {
			continue;
		}
		const x = rect.left - overlayRect.left;
		const y = rect.top - overlayRect.top;

		// Range.getClientRects() can return duplicate rects at inline
		// formatting boundaries (e.g. <em>, <strong>). Skip exact matches.
		const isDuplicate = rects.some(
			( r ) =>
				r.x === x &&
				r.y === y &&
				r.width === rect.width &&
				r.height === rect.height
		);
		if ( isDuplicate ) {
			continue;
		}

		rects.push( {
			x,
			y,
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
 * @param overlayRect    - Pre-computed bounding rect of the overlay element
 * @return Array of selection rectangles relative to the overlay
 */
export const getFullBlockSelectionRects = (
	blockElement: HTMLElement,
	editorDocument: Document,
	overlayRect: DOMRect
): SelectionRect[] => {
	const range = editorDocument.createRange();
	range.selectNodeContents( blockElement );
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
export const getBlocksBetween = (
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

/**
 * Given a block element and a character offset, returns an exact inner node and offset for use in a range.
 *
 * @param blockElement   - The block element
 * @param offset         - The character offset
 * @param editorDocument - The editor document
 * @return The node and offset of the character at the offset
 */
export const findInnerBlockOffset = (
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
export const isNodeBefore = ( a: Node, b: Node ): boolean =>
	a.compareDocumentPosition( b ) === Node.DOCUMENT_POSITION_FOLLOWING;
