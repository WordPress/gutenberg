import type { GridItemLimits, ResizeDelta } from './types';

/**
 * Pixel dimensions for the snapped resize preview outline.
 */
export type ResizeSnapSize = {
	widthPx: number;
	/** When `null`, the preview spans the item's content height (lanes). */
	heightPx: number | null;
};

/**
 * Clamps a resize delta so the tile cannot shrink below the given
 * minimum size, nor grow past the given maximum when one applies.
 *
 * @param delta              Cursor offset from the gesture start in pixels.
 * @param initialSize        Size captured at gesture start.
 * @param initialSize.width  Initial width in pixels.
 * @param initialSize.height Initial height in pixels.
 * @param minSize            Minimum tile size in pixels.
 * @param minSize.width      Minimum width in pixels.
 * @param minSize.height     Minimum height in pixels, when vertical resize applies.
 * @param maxSize            Maximum tile size in pixels, when one applies.
 * @param maxSize.width      Maximum width in pixels.
 * @param maxSize.height     Maximum height in pixels, when vertical resize applies.
 */
export function clampResizeDelta(
	delta: ResizeDelta,
	initialSize: { width: number; height: number },
	minSize: { width: number; height?: number },
	maxSize?: { width?: number; height?: number }
): ResizeDelta {
	const maxShrinkWidth = initialSize.width - minSize.width;
	let width = Math.max( delta.width, -maxShrinkWidth );
	if ( maxSize?.width !== undefined ) {
		width = Math.min( width, maxSize.width - initialSize.width );
	}
	if ( minSize.height === undefined ) {
		return { ...delta, width };
	}
	const maxShrinkHeight = initialSize.height - minSize.height;
	let height = Math.max( delta.height, -maxShrinkHeight );
	if ( maxSize?.height !== undefined ) {
		height = Math.min( height, maxSize.height - initialSize.height );
	}
	return { width, height };
}

/**
 * Converts grid spans to pixel width/height for the resize-preview
 * outline, using the same track math the surface uses for placement.
 *
 * @param columnSpan  Number of columns the snap target spans.
 * @param rowSpan     Number of rows the snap target spans.
 * @param columnWidth Width of one column track in pixels.
 * @param gapPx       Gap between tracks in pixels.
 * @param rowHeightPx Row track height in pixels, or `null` when rows
 *                    are content-sized.
 */
export function gridSpanToPixelSize(
	columnSpan: number,
	rowSpan: number,
	columnWidth: number,
	gapPx: number,
	rowHeightPx: number | null
): ResizeSnapSize {
	const widthPx = columnSpan * columnWidth + ( columnSpan - 1 ) * gapPx;
	const heightPx =
		rowHeightPx === null
			? null
			: rowSpan * rowHeightPx + ( rowSpan - 1 ) * gapPx;
	return { widthPx, heightPx };
}

/**
 * Span bounds derived from per-item pixel limits, in whole tracks.
 * Maximums are concrete: an undeclared width maximum resolves to the
 * column count, an undeclared or inapplicable height maximum to
 * `Infinity`.
 */
export type SpanBounds = {
	minWidth: number;
	minHeight: number;
	maxWidth: number;
	maxHeight: number;
};

/**
 * Converts per-item pixel limits to span bounds, using the same track
 * math as `gridSpanToPixelSize`: minimums round up so the derived span
 * always covers the requested pixels, maximums round down so it always
 * fits inside them, and every bound stays at one track or more. A
 * minimum that exceeds a maximum after quantization wins over it.
 * Width bounds saturate at the surface's column count; height bounds
 * resolve to `1`/`Infinity` when rows are content-sized.
 *
 * @param limits      Size limits in pixels.
 * @param columnWidth Width of one column track in pixels.
 * @param gapPx       Gap between tracks in pixels.
 * @param rowHeightPx Row track height in pixels, or `null` when rows
 *                    are content-sized.
 * @param maxColumns  Number of column tracks in the surface.
 */
export function pixelLimitsToSpanBounds(
	limits: GridItemLimits,
	columnWidth: number,
	gapPx: number,
	rowHeightPx: number | null,
	maxColumns: number
): SpanBounds {
	let minWidth = 1;
	let maxWidth = maxColumns;
	if ( columnWidth > 0 ) {
		const columnTrack = columnWidth + gapPx;
		if ( limits.minWidth ) {
			minWidth = Math.min(
				Math.max(
					1,
					Math.ceil( ( limits.minWidth + gapPx ) / columnTrack )
				),
				maxColumns
			);
		}
		if ( limits.maxWidth ) {
			maxWidth = Math.min(
				Math.max(
					1,
					Math.floor( ( limits.maxWidth + gapPx ) / columnTrack )
				),
				maxColumns
			);
		}
	}

	let minHeight = 1;
	let maxHeight = Infinity;
	if ( rowHeightPx !== null && rowHeightPx > 0 ) {
		const rowTrack = rowHeightPx + gapPx;
		if ( limits.minHeight ) {
			minHeight = Math.max(
				1,
				Math.ceil( ( limits.minHeight + gapPx ) / rowTrack )
			);
		}
		if ( limits.maxHeight ) {
			maxHeight = Math.max(
				1,
				Math.floor( ( limits.maxHeight + gapPx ) / rowTrack )
			);
		}
	}

	return {
		minWidth,
		minHeight,
		maxWidth: Math.max( maxWidth, minWidth ),
		maxHeight: Math.max( maxHeight, minHeight ),
	};
}
