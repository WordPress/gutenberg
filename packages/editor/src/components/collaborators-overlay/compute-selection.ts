import { SelectionDirection, SelectionType } from '@wordpress/core-data';
import type { ResolvedSelection } from '@wordpress/core-data';

import {
	getCursorPosition,
	getSelectionRects,
	getFullBlockSelectionRects,
	getBlocksBetween,
	isNodeBefore,
} from './cursor-dom-utils';
import type { CursorCoords, SelectionRect } from './cursor-dom-utils';

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

/** Selection rects and the resolved block elements for a multi-block selection. */
interface MultiBlockResult {
	rects: SelectionRect[];
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
	const blockElement =
		overlayContext.editorDocument.querySelector< HTMLElement >(
			`[data-block="${ start.localClientId }"]`
		);
	return {
		coords: getCursorPosition(
			start.richTextOffset,
			blockElement,
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
	if (
		! start.localClientId ||
		! end.localClientId ||
		start.richTextOffset === null ||
		end.richTextOffset === null
	) {
		return {};
	}

	const isReverse =
		selection.selectionDirection === SelectionDirection.Backward;
	const activeEnd = isReverse ? start : end;

	let allRects: SelectionRect[];
	let activeEndBlock: HTMLElement | null = null;

	if ( selection.type === SelectionType.SelectionInOneBlock ) {
		const result = computeSingleBlockRects( start, end, overlayContext );
		allRects = result.rects;
		// Single block: start and end share the same block element.
		activeEndBlock = result.blockElement;
	} else {
		const result = computeMultiBlockRects( start, end, overlayContext );
		allRects = result.rects;
		// Pick the block element that matches the active end.
		activeEndBlock =
			activeEnd.localClientId === result.firstBlockClientId
				? result.firstBlock
				: result.lastBlock;
	}

	if ( allRects.length > 0 ) {
		return {
			coords: getCursorPosition(
				activeEnd.richTextOffset,
				activeEndBlock,
				overlayContext.editorDocument,
				overlayContext.overlayRect
			),
			selectionRects: allRects,
		};
	}

	// Fallback: cursor at start position only.
	const startBlock =
		overlayContext.editorDocument.querySelector< HTMLElement >(
			`[data-block="${ start.localClientId }"]`
		);

	return {
		coords: getCursorPosition(
			start.richTextOffset,
			startBlock,
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
	const blockElement =
		overlayContext.editorDocument.querySelector< HTMLElement >(
			`[data-block="${ start.localClientId }"]`
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
	let firstBlock = overlayContext.editorDocument.querySelector< HTMLElement >(
		`[data-block="${ docFirst.localClientId }"]`
	);
	let lastBlock = overlayContext.editorDocument.querySelector< HTMLElement >(
		`[data-block="${ docLast.localClientId }"]`
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
		docFirst.richTextOffset === null ||
		docLast.richTextOffset === null ||
		! docFirst.localClientId ||
		! docLast.localClientId
	) {
		return {
			rects: [],
			firstBlock: null,
			lastBlock: null,
			firstBlockClientId: null,
		};
	}

	const allRects: SelectionRect[] = [];

	// First block: from start offset to end of block.
	const startRects = getSelectionRects(
		firstBlock,
		docFirst.richTextOffset,
		Number.MAX_SAFE_INTEGER,
		overlayContext.editorDocument,
		overlayContext.overlayRect
	);
	if ( startRects ) {
		allRects.push( ...startRects );
	}

	// Intermediate blocks: full content.
	const intermediateBlocks = getBlocksBetween(
		docFirst.localClientId,
		docLast.localClientId,
		overlayContext.editorDocument
	);
	for ( const intermediateBlock of intermediateBlocks ) {
		const rects = getFullBlockSelectionRects(
			intermediateBlock,
			overlayContext.editorDocument,
			overlayContext.overlayRect
		);
		allRects.push( ...rects );
	}

	// Last block: from 0 to end offset.
	const endRects = getSelectionRects(
		lastBlock,
		0,
		docLast.richTextOffset,
		overlayContext.editorDocument,
		overlayContext.overlayRect
	);
	if ( endRects ) {
		allRects.push( ...endRects );
	}

	return {
		rects: allRects,
		firstBlock,
		lastBlock,
		firstBlockClientId: docFirst.localClientId,
	};
}
