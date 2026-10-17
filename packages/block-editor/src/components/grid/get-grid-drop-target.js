import { GridRect, getClosestTrack } from './utils';

function clamp( value, min, max ) {
	return Math.min( Math.max( value, min ), max );
}

/**
 * Works out which cells a block being dragged over a grid would land in.
 *
 * The block keeps the point it was grabbed at under the pointer (see
 * `getGrabPoint`), or its center. The block's top-left corner snaps to the
 * closest cell. The landing area keeps the block's span, up to the size of the
 * grid, and is clamped to stay inside the grid.
 *
 * @param {Object}                              options
 * @param {number}                              options.x            Pointer position in pixels, relative to the start of the first column track.
 * @param {number}                              options.y            Pointer position in pixels, relative to the start of the first row track.
 * @param {Array<{start: number, end: number}>} options.columnTracks Column tracks, as returned by `getGridTracks`.
 * @param {Array<{start: number, end: number}>} options.rowTracks    Row tracks, as returned by `getGridTracks`.
 * @param {number}                              options.columnSpan   Number of columns the block spans. A span wider than the grid is reduced to fit.
 * @param {number}                              options.rowSpan      Number of rows the block spans. A span taller than the grid is reduced to fit.
 * @param {number}                              options.width        Width of the block in pixels, without its rotation. Defaults to the width of the columns it spans.
 * @param {number}                              options.height       Height of the block in pixels, without its rotation. Defaults to the height of the rows it spans.
 * @param {number}                              options.grabX        Where the block was grabbed, in pixels from its left edge. Defaults to its center.
 * @param {number}                              options.grabY        Where the block was grabbed, in pixels from its top edge. Defaults to its center.
 *
 * @return {GridRect} The cells the block would land in.
 */
export function getGridDropTarget( {
	x,
	y,
	columnTracks,
	rowTracks,
	columnSpan = 1,
	rowSpan = 1,
	width = getSpanSize( columnTracks, columnSpan ),
	height = getSpanSize( rowTracks, rowSpan ),
	grabX = width / 2,
	grabY = height / 2,
} ) {
	const column = getClosestTrack( columnTracks, x - grabX ) + 1;
	const row = getClosestTrack( rowTracks, y - grabY ) + 1;
	const fittedColumnSpan = clamp( columnSpan, 1, columnTracks.length );
	const fittedRowSpan = clamp( rowSpan, 1, rowTracks.length );
	return new GridRect( {
		columnStart: clamp(
			column,
			1,
			columnTracks.length - fittedColumnSpan + 1
		),
		rowStart: clamp( row, 1, rowTracks.length - fittedRowSpan + 1 ),
		columnSpan: fittedColumnSpan,
		rowSpan: fittedRowSpan,
	} );
}

/**
 * Works out where a block being dragged over its grid was grabbed, from where
 * the pointer first moves over the grid.
 *
 * A block dragged by its body was grabbed at that point inside it. A block
 * dragged by its drag handle was grabbed outside it, but keeps the same offset
 * from its top-left corner, so that it doesn't jump when the drag starts. A
 * block dragged from anywhere else is centered on the pointer.
 *
 * @param {Object}  options
 * @param {number}  options.x            Pointer position in pixels, in the same space as `pixelRect`.
 * @param {number}  options.y            Pointer position in pixels, in the same space as `pixelRect`.
 * @param {Object}  options.pixelRect    The block's rectangle, with `left`, `top`, `right` and `bottom`, or null when it isn't in the grid.
 * @param {boolean} options.isHandleDrag Whether the drag started from the block's drag handle.
 *
 * @return {{grabX?: number, grabY?: number}} Where the block was grabbed, in pixels from its top-left corner, or nothing to center it.
 */
export function getGrabPoint( { x, y, pixelRect, isHandleDrag = false } ) {
	if ( ! pixelRect ) {
		return {};
	}
	const isInside =
		x >= pixelRect.left &&
		x <= pixelRect.right &&
		y >= pixelRect.top &&
		y <= pixelRect.bottom;
	if ( ! isInside && ! isHandleDrag ) {
		return {};
	}
	return { grabX: x - pixelRect.left, grabY: y - pixelRect.top };
}

/**
 * Gets the size in pixels of a number of tracks starting at the first one,
 * including the gaps between them.
 *
 * @param {Array<{start: number, end: number}>} tracks Grid tracks, as returned by `getGridTracks`.
 * @param {number}                              span   Number of tracks.
 *
 * @return {number} The size in pixels.
 */
function getSpanSize( tracks, span ) {
	const lastTrack = tracks[ Math.min( span, tracks.length ) - 1 ];
	return lastTrack ? lastTrack.end - tracks[ 0 ].start : 0;
}

/**
 * Converts a range of grid cells to a rectangle in pixels.
 *
 * @param {GridRect}                            rect         The grid cells.
 * @param {Array<{start: number, end: number}>} columnTracks Column tracks, as returned by `getGridTracks`.
 * @param {Array<{start: number, end: number}>} rowTracks    Row tracks, as returned by `getGridTracks`.
 *
 * @return {{left: number, top: number, right: number, bottom: number}|null} The rectangle, relative to the first track, or null if the cells are outside the tracks.
 */
export function getPixelRectFromGridRect( rect, columnTracks, rowTracks ) {
	const firstColumn = columnTracks[ rect.columnStart - 1 ];
	const lastColumn = columnTracks[ rect.columnEnd - 1 ];
	const firstRow = rowTracks[ rect.rowStart - 1 ];
	const lastRow = rowTracks[ rect.rowEnd - 1 ];
	if ( ! firstColumn || ! lastColumn || ! firstRow || ! lastRow ) {
		return null;
	}
	return {
		left: firstColumn.start,
		top: firstRow.start,
		right: lastColumn.end,
		bottom: lastRow.end,
	};
}
