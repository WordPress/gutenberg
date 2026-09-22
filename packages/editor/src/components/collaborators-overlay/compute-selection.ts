import { privateApis as coreDataPrivateApis } from '@wordpress/core-data';
import type {
	CoreDataPrivateApis,
	ResolvedSelection,
} from '@wordpress/core-data';
import { unlock } from '../../lock-unlock';
import {
	getCursorPosition,
	getOrderedBlockRange,
	getSelectionRects,
} from './cursor-dom-utils';
import type { CursorCoords, SelectionRect } from './cursor-dom-utils';

const { SelectionDirection, SelectionType } = unlock(
	coreDataPrivateApis
) as Pick< CoreDataPrivateApis, 'SelectionDirection' | 'SelectionType' >;

/** Common parameters passed to cursor/selection computation helpers. */
interface OverlayContext {
	editorDocument: Document;
	overlayRect: DOMRect;
}

/** Selection rects and the resolved block element for a single-block selection. */
interface SingleBlockResult {
	rects: SelectionRect[];
	blockElement: HTMLElement | null;
}

/** Result of computing visual cursor/selection state for a single user. */
export interface SelectionVisual {
	coords?: CursorCoords | null;
	selectionRects?: SelectionRect[];
}

/**
 * Resolve the most specific editor element the selection refers to.
 *
 * When the sender carries an `attributeKey`, narrow to the RichText element
 * matching `data-wp-block-attribute-key` inside the block. This is what makes
 * cursor placement work for blocks with multiple RichText fields (e.g.
 * `core/table` cells: `body.0.cells.0.content`, etc.). Falls back to the
 * block element when `attributeKey` is missing (WholeBlock selections,
 * older senders, or DOM lookup miss).
 *
 * @param editorDocument    - The editor document.
 * @param resolvedSelection - The resolved selection.
 * @return The target element (RichText editable or block), or null.
 */
export function resolveTargetElement(
	editorDocument: Document,
	resolvedSelection: ResolvedSelection
): HTMLElement | null {
	if ( ! resolvedSelection.localClientId ) {
		return null;
	}

	const blockElement = editorDocument.querySelector< HTMLElement >(
		`[data-block="${ resolvedSelection.localClientId }"]`
	);

	if ( ! blockElement || ! resolvedSelection.attributeKey ) {
		return blockElement;
	}

	const attrKey = CSS.escape( resolvedSelection.attributeKey );
	const byKey = blockElement.querySelector< HTMLElement >(
		`[data-wp-block-attribute-key="${ attrKey }"]`
	);
	if ( byKey ) {
		return byKey;
	}

	// Fallback chain — each is safer than the raw [data-block] wrapper because
	// [data-block] includes toolbar text nodes that corrupt the TreeWalker
	// offset walk inside findInnerBlockOffset.
	//
	// 1. contenteditable — present when the block is in edit mode.
	const editable = blockElement.querySelector< HTMLElement >(
		'[contenteditable="true"]'
	);
	if ( editable ) {
		return editable;
	}

	// 2. Common block-level text elements — always present in the DOM regardless
	//    of whether the block is currently focused by this user.
	const textEl = blockElement.querySelector< HTMLElement >(
		'p, h1, h2, h3, h4, h5, h6, pre, blockquote, td, th, li, figcaption'
	);
	return textEl ?? blockElement;
}

/**
 * Compute cursor coords and optional selection rects for a single user's selection.
 *
 * @param selection      - The selection state from the awareness layer.
 * @param start          - Start position (block clientId + text index).
 * @param end            - End position (only for range selections).
 * @param overlayContext - Shared editor document / overlay references.
 * @return Cursor coordinates and optional selection rectangles.
 */
export function computeSelectionVisual(
	selection: any,
	start: ResolvedSelection,
	end: ResolvedSelection | undefined,
	overlayContext: OverlayContext
): SelectionVisual {
	if (
		selection.type === SelectionType.None ||
		selection.type === SelectionType.WholeBlock
	) {
		return {};
	}

	if ( selection.type === SelectionType.Cursor ) {
		return computeCursorOnly( start, overlayContext );
	}

	// SelectionInOneBlock or SelectionInMultipleBlocks.
	if ( ! end ) {
		return {};
	}
	return computeTextSelection( selection, start, end, overlayContext );
}

/**
 * Compute cursor coordinates for a simple cursor (no highlighted text).
 *
 * @param start          - Cursor position (block clientId + text index).
 * @param overlayContext - Shared editor document / overlay references.
 * @return Cursor coordinates.
 */
function computeCursorOnly(
	start: ResolvedSelection,
	overlayContext: OverlayContext
): SelectionVisual {
	if ( ! start.localClientId ) {
		return {};
	}
	const targetElement = resolveTargetElement(
		overlayContext.editorDocument,
		start
	);
	return {
		coords: getCursorPosition(
			start.richTextOffset,
			targetElement,
			overlayContext.editorDocument,
			overlayContext.overlayRect
		),
	};
}

/**
 * Compute cursor coordinates and selection highlight rects for a text selection
 * (single-block or multi-block).
 *
 * @param selection      - The selection state.
 * @param start          - Start position (block clientId + text index).
 * @param end            - End position (block clientId + text index).
 * @param overlayContext - Shared editor document / overlay references.
 * @return Cursor coordinates and optional selection rectangles.
 */
function computeTextSelection(
	selection: any,
	start: ResolvedSelection,
	end: ResolvedSelection,
	overlayContext: OverlayContext
): SelectionVisual {
	if ( ! start.localClientId || ! end.localClientId ) {
		return {};
	}

	const isReverse =
		selection.selectionDirection === SelectionDirection.Backward;
	const activeEnd = isReverse ? start : end;

	// Single-block: both endpoints must have a text offset.
	if ( selection.type === SelectionType.SelectionInOneBlock ) {
		if ( start.richTextOffset === null || end.richTextOffset === null ) {
			return {};
		}
		const result = computeSingleBlockRects( start, end, overlayContext );
		if ( result.rects.length > 0 ) {
			return {
				coords: getCursorPosition(
					activeEnd.richTextOffset,
					result.blockElement,
					overlayContext.editorDocument,
					overlayContext.overlayRect
				),
				selectionRects: result.rects,
			};
		}
		// Fallback: cursor only, no selection rects.
		return {
			coords: getCursorPosition(
				start.richTextOffset,
				resolveTargetElement( overlayContext.editorDocument, start ),
				overlayContext.editorDocument,
				overlayContext.overlayRect
			),
		};
	}

	// Multi-block: full bounding-box overlay for text blocks, CSS outline for
	// non-text blocks (image, spacer, etc.) via use-block-highlighting.
	// No cursor coords — the single avatar placed by use-block-highlighting on
	// the topmost block is the only indicator.
	return computeMultiBlockOverlayRects( start, end, overlayContext );
}

/**
 * Return a full bounding-box SelectionRect for a block element.
 *
 * @param blockEl     - The block element.
 * @param overlayRect - Overlay bounding rect for coordinate transform.
 * @return A single SelectionRect covering the full block.
 */
function blockBoundingRect(
	blockEl: HTMLElement,
	overlayRect: DOMRect
): SelectionRect {
	const r = blockEl.getBoundingClientRect();
	return {
		x: r.left - overlayRect.left,
		y: r.top - overlayRect.top,
		width: r.width,
		height: r.height,
	};
}

/**
 * Compute overlay rects for a multi-block selection.
 *
 * Expects start/end to already carry container-level clientIds (inner-block
 * promotion is performed by the caller, use-render-cursors, before this
 * function is invoked). richTextOffset is null on promoted endpoints, which
 * triggers the full bounding-box path for those blocks.
 *
 * - Middle blocks always receive a full bounding-box overlay.
 * - First block: full bounding-box when offset is null or 0; partial otherwise.
 * - Last block: partial rects from 0 to offset; full bounding-box when null.
 * - Non-text blocks (image, spacer — no visible innerText) produce no rects;
 *   CSS outline in use-block-highlighting handles those instead.
 *
 * @param start          - Start endpoint (container-level clientId + text offset).
 * @param end            - End endpoint (container-level clientId + text offset).
 * @param overlayContext - Shared editor document / overlay references.
 * @return selectionRects covering each text block in the selection, or {}.
 */
function computeMultiBlockOverlayRects(
	start: ResolvedSelection,
	end: ResolvedSelection,
	overlayContext: OverlayContext
): SelectionVisual {
	const { editorDocument, overlayRect } = overlayContext;

	const range = getOrderedBlockRange(
		start.localClientId!,
		end.localClientId!,
		editorDocument
	);
	if ( ! range ) {
		return {};
	}

	// Align ResolvedSelection objects with the DOM-ordered elements returned by
	// the helper. start/end are in Yjs selection direction; firstId tells us
	// which input ended up first in the document.
	const docFirst = range.firstId === start.localClientId ? start : end;
	const docLast = range.firstId === start.localClientId ? end : start;
	const {
		firstEl: docFirstEl,
		lastEl: docLastEl,
		middleEls,
		sameContainer,
	} = range;

	// When both endpoints resolve to the same container after promotion
	// (e.g. two list-items in the same list), fall back to a full bounding-box.
	if ( sameContainer ) {
		return docFirstEl.innerText?.trim()
			? {
					selectionRects: [
						blockBoundingRect( docFirstEl, overlayRect ),
					],
			  }
			: {};
	}

	const MAX = Number.MAX_SAFE_INTEGER;
	const rects: SelectionRect[] = [];

	// First block: full bounding-box when offset is null or 0 (includes
	// promoted endpoints whose offset was nulled in use-render-cursors).
	if ( docFirstEl.innerText?.trim() ) {
		const firstOffset = docFirst.richTextOffset;
		if ( firstOffset === null || firstOffset === 0 ) {
			rects.push( blockBoundingRect( docFirstEl, overlayRect ) );
		} else {
			const el = resolveTargetElement( editorDocument, docFirst );
			const textRects = el
				? getSelectionRects(
						el,
						firstOffset,
						MAX,
						editorDocument,
						overlayRect
				  )
				: null;
			rects.push(
				...( textRects ?? [
					blockBoundingRect( docFirstEl, overlayRect ),
				] )
			);
		}
	}

	// Middle blocks — always the full block width.
	for ( const blockEl of middleEls ) {
		if ( blockEl.innerText?.trim() ) {
			rects.push( blockBoundingRect( blockEl, overlayRect ) );
		}
	}

	// Last block: partial rects from 0 to offset; full when null.
	if ( docLastEl.innerText?.trim() ) {
		const lastOffset = docLast.richTextOffset;
		if ( lastOffset === null ) {
			rects.push( blockBoundingRect( docLastEl, overlayRect ) );
		} else if ( lastOffset > 0 ) {
			const el = resolveTargetElement( editorDocument, docLast );
			const textRects = el
				? getSelectionRects(
						el,
						0,
						lastOffset,
						editorDocument,
						overlayRect
				  )
				: null;
			rects.push(
				...( textRects ?? [
					blockBoundingRect( docLastEl, overlayRect ),
				] )
			);
		}
		// lastOffset === 0: cursor at the very start — nothing selected here.
	}

	return rects.length > 0 ? { selectionRects: rects } : {};
}

/**
 * Compute selection rects for a selection within a single block.
 *
 * @param start          - Start position (block clientId + text index).
 * @param end            - End position (block clientId + text index).
 * @param overlayContext - Shared editor document / overlay references.
 * @return Array of selection rectangles.
 */
function computeSingleBlockRects(
	start: ResolvedSelection,
	end: ResolvedSelection,
	overlayContext: OverlayContext
): SingleBlockResult {
	const blockElement = resolveTargetElement(
		overlayContext.editorDocument,
		start
	);
	if (
		! blockElement ||
		start.richTextOffset === null ||
		end.richTextOffset === null
	) {
		return { rects: [], blockElement: null };
	}
	return {
		rects:
			getSelectionRects(
				blockElement,
				start.richTextOffset,
				end.richTextOffset,
				overlayContext.editorDocument,
				overlayContext.overlayRect
			) ?? [],
		blockElement,
	};
}
