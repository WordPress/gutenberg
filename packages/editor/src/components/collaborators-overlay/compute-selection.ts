import { SelectionDirection, SelectionType } from '@wordpress/core-data';
import type { ResolvedSelection } from '@wordpress/core-data';

import {
	getCursorPosition,
	getSelectionRects,
	getFullBlockSelectionRects,
	getBlocksBetween,
	isNodeBefore,
} from './cursor-dom-utils';
import type { SelectionRect } from './cursor-dom-utils';

interface CursorCoords {
	x: number;
	y: number;
	height: number;
}

/** Common parameters passed to cursor/selection computation helpers. */
interface CursorContext {
	editorDocument: Document;
	overlayRect: DOMRect;
}

/** Result of computing visual cursor/selection state for a single user. */
export interface SelectionVisual {
	coords?: CursorCoords | null;
	selectionRects?: SelectionRect[];
}

/**
 * Compute cursor coords and optional selection rects for a single user's selection.
 *
 * @param selection     - The selection state from the awareness layer.
 * @param start         - Start position (block clientId + text index).
 * @param end           - End position (only for range selections).
 * @param cursorContext - Shared editor document / overlay references.
 * @return Cursor coordinates and optional selection rectangles.
 */
export function computeSelectionVisual(
	selection: any,
	start: ResolvedSelection,
	end: ResolvedSelection | undefined,
	cursorContext: CursorContext
): SelectionVisual {
	if (
		selection.type === SelectionType.None ||
		selection.type === SelectionType.WholeBlock
	) {
		return {};
	}

	if ( selection.type === SelectionType.Cursor ) {
		return computeCursorOnly( start, cursorContext );
	}

	// SelectionInOneBlock or SelectionInMultipleBlocks.
	if ( ! end ) {
		return {};
	}
	return computeTextSelection( selection, start, end, cursorContext );
}

/**
 * Compute cursor coordinates for a simple cursor (no highlighted text).
 *
 * @param start         - Cursor position (block clientId + text index).
 * @param cursorContext - Shared editor document / overlay references.
 * @return Cursor coordinates.
 */
function computeCursorOnly(
	start: ResolvedSelection,
	cursorContext: CursorContext
): SelectionVisual {
	if ( ! start.localClientId ) {
		return {};
	}
	const blockElement =
		cursorContext.editorDocument.querySelector< HTMLElement >(
			`[data-block="${ start.localClientId }"]`
		);
	return {
		coords: getCursorPosition(
			start.textIndex,
			blockElement,
			cursorContext.editorDocument,
			cursorContext.overlayRect
		),
	};
}

/**
 * Compute cursor coordinates and selection highlight rects for a text selection
 * (single-block or multi-block).
 *
 * @param selection     - The selection state.
 * @param start         - Start position (block clientId + text index).
 * @param end           - End position (block clientId + text index).
 * @param cursorContext - Shared editor document / overlay references.
 * @return Cursor coordinates and optional selection rectangles.
 */
function computeTextSelection(
	selection: any,
	start: ResolvedSelection,
	end: ResolvedSelection,
	cursorContext: CursorContext
): SelectionVisual {
	if (
		! start.localClientId ||
		! end.localClientId ||
		start.textIndex === null ||
		end.textIndex === null
	) {
		return {};
	}

	const isReverse =
		selection.selectionDirection === SelectionDirection.Backward;
	const activeEnd = isReverse ? start : end;

	let allRects: SelectionRect[];
	let activeEndBlock: HTMLElement | null = null;

	if ( selection.type === SelectionType.SelectionInOneBlock ) {
		const result = computeSingleBlockRects( start, end, cursorContext );
		allRects = result.rects;
		// Single block: start and end share the same block element.
		activeEndBlock = result.blockElement;
	} else {
		const result = computeMultiBlockRects( start, end, cursorContext );
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
				activeEnd.textIndex,
				activeEndBlock,
				cursorContext.editorDocument,
				cursorContext.overlayRect
			),
			selectionRects: allRects,
		};
	}

	// Fallback: cursor at start position only.
	const startBlock =
		cursorContext.editorDocument.querySelector< HTMLElement >(
			`[data-block="${ start.localClientId }"]`
		);

	return {
		coords: getCursorPosition(
			start.textIndex,
			startBlock,
			cursorContext.editorDocument,
			cursorContext.overlayRect
		),
	};
}

/**
 * Compute selection rects for a selection within a single block.
 *
 * @param start         - Start position (block clientId + text index).
 * @param end           - End position (block clientId + text index).
 * @param cursorContext - Shared editor document / overlay references.
 * @return Array of selection rectangles.
 */
function computeSingleBlockRects(
	start: ResolvedSelection,
	end: ResolvedSelection,
	cursorContext: CursorContext
): { rects: SelectionRect[]; blockElement: HTMLElement | null } {
	const blockElement =
		cursorContext.editorDocument.querySelector< HTMLElement >(
			`[data-block="${ start.localClientId }"]`
		);
	if (
		! blockElement ||
		start.textIndex === null ||
		end.textIndex === null
	) {
		return { rects: [], blockElement: null };
	}
	return {
		rects:
			getSelectionRects(
				blockElement,
				start.textIndex,
				end.textIndex,
				cursorContext.editorDocument,
				cursorContext.overlayRect
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
 * @param start         - Start position (block clientId + text index).
 * @param end           - End position (block clientId + text index).
 * @param cursorContext - Shared editor document / overlay references.
 * @return Array of selection rectangles.
 */
function computeMultiBlockRects(
	start: ResolvedSelection,
	end: ResolvedSelection,
	cursorContext: CursorContext
): {
	rects: SelectionRect[];
	firstBlock: HTMLElement | null;
	lastBlock: HTMLElement | null;
	firstBlockClientId: string | null;
} {
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

	if (
		! firstBlock ||
		! lastBlock ||
		docFirst.textIndex === null ||
		docLast.textIndex === null ||
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
		docFirst.textIndex,
		Number.MAX_SAFE_INTEGER,
		cursorContext.editorDocument,
		cursorContext.overlayRect
	);
	if ( startRects ) {
		allRects.push( ...startRects );
	}

	// Intermediate blocks: full content.
	const intermediateBlocks = getBlocksBetween(
		docFirst.localClientId,
		docLast.localClientId,
		cursorContext.editorDocument
	);
	for ( const intermediateBlock of intermediateBlocks ) {
		const rects = getFullBlockSelectionRects(
			intermediateBlock,
			cursorContext.editorDocument,
			cursorContext.overlayRect
		);
		allRects.push( ...rects );
	}

	// Last block: from 0 to end offset.
	const endRects = getSelectionRects(
		lastBlock,
		0,
		docLast.textIndex,
		cursorContext.editorDocument,
		cursorContext.overlayRect
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
