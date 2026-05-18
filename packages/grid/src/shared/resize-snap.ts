/**
 * Pixel dimensions for the snapped resize preview outline.
 */
export type ResizeSnapSize = {
	widthPx: number;
	/** When `null`, the preview spans the item's content height (lanes). */
	heightPx: number | null;
};

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
