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
	overlay: HTMLElement;
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
	return computeTextSelection( selection, start, end!, cursorContext );
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
	return {
		coords: getCursorPosition(
			start.textIndex,
			start.localClientId,
			cursorContext.editorDocument,
			cursorContext.overlay
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
 * @param start         - Start position (block clientId + text index).
 * @param end           - End position (block clientId + text index).
 * @param cursorContext - Shared editor document / overlay references.
 * @return Array of selection rectangles.
 */
function computeSingleBlockRects(
	start: ResolvedSelection,
	end: ResolvedSelection,
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
 * @param start         - Start position (block clientId + text index).
 * @param end           - End position (block clientId + text index).
 * @param cursorContext - Shared editor document / overlay references.
 * @return Array of selection rectangles.
 */
function computeMultiBlockRects(
	start: ResolvedSelection,
	end: ResolvedSelection,
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
