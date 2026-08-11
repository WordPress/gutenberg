import type { ResizeDelta } from './types';

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
 * minimum width (and height when provided).
 *
 * @param delta              Cursor offset from the gesture start in pixels.
 * @param initialSize        Size captured at gesture start.
 * @param initialSize.width  Initial width in pixels.
 * @param initialSize.height Initial height in pixels.
 * @param minSize            Minimum tile size in pixels.
 * @param minSize.width      Minimum width in pixels.
 * @param minSize.height     Minimum height in pixels, when vertical resize applies.
 */
export function clampResizeDelta(
	delta: ResizeDelta,
	initialSize: { width: number; height: number },
	minSize: { width: number; height?: number }
): ResizeDelta {
	const maxShrinkWidth = initialSize.width - minSize.width;
	const width = Math.max( delta.width, -maxShrinkWidth );
	if ( minSize.height === undefined ) {
		return { ...delta, width };
	}
	const maxShrinkHeight = initialSize.height - minSize.height;
	const height = Math.max( delta.height, -maxShrinkHeight );
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
