// @ts-expect-error - No type declarations available for @wordpress/block-editor
// prettier-ignore
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { unlock } from '../../lock-unlock';

const { isElementVisible } = unlock( blockEditorPrivateApis );

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

/**
 * Walk up from a hidden element (e.g. text inside a collapsed core/details
 * or an inactive core/accordion panel) to the nearest [data-block] ancestor
 * that's actually visible — always the collapsed container's own wrapper,
 * since only its *inner* content collapses, never the wrapper itself.
 *
 * Used to give collaborators a visible presence indicator (avatar/outline)
 * on the container when their cursor/selection is inside hidden content, in
 * place of a cursor that would otherwise have nowhere valid to render.
 *
 * @param element - The hidden element to walk up from.
 * @return The nearest visible [data-block] ancestor, or null if none found.
 */
export const getNearestVisibleBlockAncestor = (
	element: HTMLElement
): HTMLElement | null => {
	let current = element.closest< HTMLElement >( '[data-block]' );

	while ( current ) {
		if ( isElementVisible( current ) ) {
			return current;
		}
		current =
			current.parentElement?.closest< HTMLElement >( '[data-block]' ) ??
			null;
	}

	return null;
};

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
	// The target may be hidden inside collapsed content (e.g. a closed
	// core/details or an inactive core/accordion panel). Its range then has
	// no layout box, so don't draw a cursor at a fallback position — suppress
	// it entirely rather than misplacing it at the collapsed wrapper.
	if ( ! isElementVisible( blockElement ) ) {
		return null;
	}

	const { node, offset } = findInnerBlockOffset(
		blockElement,
		charOffset,
		editorDocument
	);

	const cursorRange = editorDocument.createRange();

	try {
		cursorRange.setStart( node, offset );
	} catch {
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
	// Same rationale as getOffsetPositionInBlock: a hidden target has no
	// layout box to derive rects from, so skip it rather than draw a
	// misplaced or empty selection.
	if ( ! isElementVisible( blockElement ) ) {
		return null;
	}

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
 * Return the nearest [data-block] ancestor of el, or el itself if it has none.
 *
 * Used to promote inner blocks (e.g. list-items) to their parent container
 * (e.g. the list block) so the whole container is treated as one visual unit
 * rather than each child block being highlighted individually.
 *
 * @param el - The block element to promote.
 * @return The nearest [data-block] ancestor, or el itself.
 */
export const blockContainerOf = ( el: HTMLElement ): HTMLElement => {
	const parent = el.parentElement;
	return parent?.hasAttribute( 'data-block' ) ? parent : el;
};

/**
 * Finds all block elements between two blocks in DOM order (exclusive of
 * start and end). Descendant blocks are filtered out — if a parent block is
 * already in the result, its children are skipped. This prevents
 * double-highlighting nested structures (e.g. selecting across a list returns
 * the list block, not the individual list items inside it).
 *
 * NOTE: startBlockId and endBlockId may be in either order — the function
 * normalises to DOM order internally.
 *
 * @param startBlockId   - The clientId of one end block
 * @param endBlockId     - The clientId of the other end block
 * @param editorDocument - The editor document
 * @return Intermediate block HTMLElements in document order, descendants excluded
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
		const block = allBlocks[ i ];
		// Skip descendants of blocks already in the result to prevent
		// double-highlights on nested blocks (e.g. list items inside a list).
		if ( ! result.some( ( r ) => r.contains( block ) ) ) {
			result.push( block );
		}
	}
	return result;
};

/**
 * Result returned by getOrderedBlockRange.
 */
export interface BlockRangeResult {
	/** DOM-order first element, promoted to its nearest [data-block] ancestor. */
	firstEl: HTMLElement;
	/** data-block value of firstEl. */
	firstId: string;
	/** DOM-order last element, promoted to its nearest [data-block] ancestor. */
	lastEl: HTMLElement;
	/** data-block value of lastEl. */
	lastId: string;
	/** Block elements strictly between first and last, descendants of either excluded. */
	middleEls: HTMLElement[];
	/** True when firstEl and lastEl resolve to the same container after promotion. */
	sameContainer: boolean;
}

/**
 * Resolve two block clientIds to a DOM-ordered, promotion-aware block range.
 *
 * Handles: querySelector for both blocks (returns null if either is missing),
 * DOM-order normalisation, promotion via blockContainerOf, and retrieval of
 * intermediate blocks with descendants of the endpoints excluded.
 *
 * When the input IDs are already at container level (e.g. already promoted by
 * the caller), blockContainerOf is a no-op and the result is identical to a
 * plain query + normalise.
 *
 * @param startId - clientId of one block endpoint (may be in either DOM order).
 * @param endId   - clientId of the other block endpoint.
 * @param doc     - The editor document.
 * @return Ordered, promoted range, or null if either element is not in the DOM.
 */
export const getOrderedBlockRange = (
	startId: string,
	endId: string,
	doc: Document
): BlockRangeResult | null => {
	const startEl = doc.querySelector< HTMLElement >(
		`[data-block="${ startId }"]`
	);
	const endEl = doc.querySelector< HTMLElement >(
		`[data-block="${ endId }"]`
	);
	if ( ! startEl || ! endEl ) {
		return null;
	}

	// Normalise to DOM order.
	const rawFirstEl = isNodeBefore( endEl, startEl ) ? endEl : startEl;
	const rawLastEl = isNodeBefore( endEl, startEl ) ? startEl : endEl;

	// Promote inner-block elements (e.g. list-items) to their nearest
	// [data-block] ancestor so both callers operate on container-level blocks.
	const firstEl = blockContainerOf( rawFirstEl );
	const lastEl = blockContainerOf( rawLastEl );
	const firstId = firstEl.getAttribute( 'data-block' )!;
	const lastId = lastEl.getAttribute( 'data-block' )!;

	const sameContainer = firstId === lastId;
	const middleEls = sameContainer
		? []
		: getBlocksBetween( firstId, lastId, doc ).filter(
				( el ) => ! firstEl.contains( el ) && ! lastEl.contains( el )
		  );

	return { firstEl, firstId, lastEl, lastId, middleEls, sameContainer };
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
const isNodeBefore = ( a: Node, b: Node ): boolean =>
	// eslint-disable-next-line no-bitwise
	!! ( a.compareDocumentPosition( b ) & Node.DOCUMENT_POSITION_FOLLOWING );
