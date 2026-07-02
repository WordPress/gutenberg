import { privateApis as coreDataPrivateApis } from '@wordpress/core-data';
import type {
	CoreDataPrivateApis,
	ResolvedSelection,
} from '@wordpress/core-data';

import { unlock } from '../../lock-unlock';
import {
	getCursorPosition,
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

/**
 * Resolved block elements for a multi-block selection. No pixel rects are
 * computed — highlighting is handled entirely via CSS outlines applied by
 * use-block-highlighting. Only the endpoint elements are needed here for
 * cursor label positioning.
 */
interface MultiBlockResult {
	firstBlock: HTMLElement | null;
	lastBlock: HTMLElement | null;
	firstBlockClientId: string | null;
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
	return (
		blockElement.querySelector< HTMLElement >(
			`[data-wp-block-attribute-key="${ attrKey }"]`
		) ?? blockElement
	);
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

	// Multi-block: all selected blocks are highlighted via CSS outline by
	// use-block-highlighting. Show a cursor label only at the active end
	// when it has a known character offset (CursorEndpoint). When the active
	// end is a WholeBlockEndpoint (richTextOffset is null — e.g. an image or
	// a block selected as a unit), there is no meaningful character position
	// to render the cursor at, so we return nothing; the block outline and
	// avatar label from use-block-highlighting are the only visuals needed.
	if ( activeEnd.richTextOffset === null ) {
		return {};
	}
	const { firstBlock, lastBlock, firstBlockClientId } =
		computeMultiBlockRects( start, end, overlayContext );
	const activeEndBlock =
		activeEnd.localClientId === firstBlockClientId ? firstBlock : lastBlock;
	return {
		coords: getCursorPosition(
			activeEnd.richTextOffset,
			activeEndBlock,
			overlayContext.editorDocument,
			overlayContext.overlayRect
		),
	};
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

/**
 * Compute selection rects for a selection spanning multiple blocks.
 *
 * Normalizes to document order — for backward selections the block editor
 * reports start after end.
 *
 * @param start          - Start position (block clientId + text index).
 * @param end            - End position (block clientId + text index).
 * @param overlayContext - Shared editor document / overlay references.
 * @return Array of selection rectangles.
 */
function computeMultiBlockRects(
	start: ResolvedSelection,
	end: ResolvedSelection,
	overlayContext: OverlayContext
): MultiBlockResult {
	let docFirst = start;
	let docLast = end;
	let firstBlock = resolveTargetElement(
		overlayContext.editorDocument,
		docFirst
	);
	let lastBlock = resolveTargetElement(
		overlayContext.editorDocument,
		docLast
	);

	// Swap to document order if needed.
	if ( firstBlock && lastBlock && isNodeBefore( lastBlock, firstBlock ) ) {
		docFirst = end;
		docLast = start;
		[ firstBlock, lastBlock ] = [ lastBlock, firstBlock ];
	}

	if (
		! firstBlock ||
		! lastBlock ||
		! docFirst.localClientId ||
		! docLast.localClientId
	) {
		return {
			firstBlock: null,
			lastBlock: null,
			firstBlockClientId: null,
		};
	}

	// All selected blocks are highlighted with a CSS outline by use-block-highlighting.
	// This function only resolves the endpoint elements needed for cursor positioning.
	return {
		firstBlock,
		lastBlock,
		firstBlockClientId: docFirst.localClientId,
	};
}
