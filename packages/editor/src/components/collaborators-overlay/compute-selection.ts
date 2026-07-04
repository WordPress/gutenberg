import { privateApis as coreDataPrivateApis } from '@wordpress/core-data';
import type {
	CoreDataPrivateApis,
	ResolvedSelection,
} from '@wordpress/core-data';

import { unlock } from '../../lock-unlock';
import {
	getCursorPosition,
	getBlocksBetween,
	getSelectionRects,
	isNodeBefore,
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
function resolveTargetElement(
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
 * - Middle blocks always receive a full bounding-box overlay.
 * - First block: full bounding-box when the cursor starts at offset 0 or the
 *   endpoint is a WholeBlock; partial text-level rects otherwise.
 * - Last block: partial text-level rects from 0 to the cursor offset when the
 *   endpoint is a CursorEndpoint; full bounding-box for WholeBlock.
 * - Non-text blocks (image, spacer — no visible innerText) produce no rects;
 *   CSS outline in use-block-highlighting handles those instead.
 *
 * @param start          - Start endpoint (resolved block clientId + text offset).
 * @param end            - End endpoint (resolved block clientId + text offset).
 * @param overlayContext - Shared editor document / overlay references.
 * @return selectionRects covering each text block in the selection, or {}.
 */
function computeMultiBlockOverlayRects(
	start: ResolvedSelection,
	end: ResolvedSelection,
	overlayContext: OverlayContext
): SelectionVisual {
	const { editorDocument, overlayRect } = overlayContext;

	const startBlockEl = editorDocument.querySelector< HTMLElement >(
		`[data-block="${ start.localClientId }"]`
	);
	const endBlockEl = editorDocument.querySelector< HTMLElement >(
		`[data-block="${ end.localClientId }"]`
	);
	if ( ! startBlockEl || ! endBlockEl ) {
		return {};
	}

	// Normalise to DOM order — Yjs reports endpoints in selection direction.
	let docFirst = start;
	let docLast = end;
	let docFirstEl = startBlockEl;
	let docLastEl = endBlockEl;
	if ( isNodeBefore( endBlockEl, startBlockEl ) ) {
		[ docFirst, docLast ] = [ docLast, docFirst ];
		[ docFirstEl, docLastEl ] = [ docLastEl, docFirstEl ];
	}

	const middleEls = getBlocksBetween(
		( docFirstEl.getAttribute( 'data-block' ) ?? '' ) as string,
		( docLastEl.getAttribute( 'data-block' ) ?? '' ) as string,
		editorDocument
	);

	const MAX = Number.MAX_SAFE_INTEGER;
	const rects: SelectionRect[] = [];

	// First block — full bounding-box when the selection starts at offset 0 or
	// this is a WholeBlock endpoint (no character position). When the cursor
	// starts mid-block, use text-level rects so only the selected portion shows.
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

	// Last block — partial text-level rects up to the cursor offset so the
	// unselected tail of the block is not highlighted. WholeBlock endpoints
	// (no character position) get the full bounding-box instead.
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
		// lastOffset === 0: cursor is at the very start of the last block —
		// nothing in this block is selected, so produce no rect.
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
