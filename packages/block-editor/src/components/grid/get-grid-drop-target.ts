import { GridRect, getClosestTrack } from './utils';
import {
	clampPixelRect,
	getGridPlacementFromPixelRect,
	snapPixelRectPosition,
} from './free-placement';
import type { GridPlacement } from './free-placement';

/**
 * The start and end position in pixels of a grid track.
 */
interface GridTrack {
	start: number;
	end: number;
}

/**
 * A range of grid cells, as 1-based column and row lines.
 */
interface GridCellRange {
	columnStart: number;
	columnEnd: number;
	rowStart: number;
	rowEnd: number;
}

/**
 * A rectangle in pixels.
 */
interface PixelRect {
	left: number;
	top: number;
	right: number;
	bottom: number;
}

interface GridDropTargetOptions {
	x: number;
	y: number;
	columnTracks: GridTrack[];
	rowTracks: GridTrack[];
	columnSpan?: number;
	rowSpan?: number;
	width?: number;
	height?: number;
	grabX?: number;
	grabY?: number;
}

function clamp( value: number, min: number, max: number ): number {
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
 * @param options              The pointer position, the grid tracks and the block's size.
 * @param options.x            Pointer position in pixels, relative to the start of the first column track.
 * @param options.y            Pointer position in pixels, relative to the start of the first row track.
 * @param options.columnTracks Column tracks, as returned by `getGridTracks`.
 * @param options.rowTracks    Row tracks, as returned by `getGridTracks`.
 * @param options.columnSpan   Number of columns the block spans. A span wider than the grid is reduced to fit.
 * @param options.rowSpan      Number of rows the block spans. A span taller than the grid is reduced to fit.
 * @param options.width        Width of the block in pixels, without its rotation. Defaults to the width of the columns it spans.
 * @param options.height       Height of the block in pixels, without its rotation. Defaults to the height of the rows it spans.
 * @param options.grabX        Where the block was grabbed, in pixels from its left edge. Defaults to its center.
 * @param options.grabY        Where the block was grabbed, in pixels from its top edge. Defaults to its center.
 *
 * @return The cells the block would land in.
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
}: GridDropTargetOptions ): GridRect {
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
 * Works out where a block being dragged over a grid with cells of a fixed
 * size would land when it is placed freely: exactly where it is let go, kept
 * inside the grid by its outline with its rotation. With `snap`, its top-left
 * corner snaps to the closest grid lines and it keeps its size.
 *
 * @param options
 * @param options.x            Pointer position in pixels, relative to the start of the first column track.
 * @param options.y            Pointer position in pixels, relative to the start of the first row track.
 * @param options.columnTracks Column tracks, as returned by `getGridTracks`.
 * @param options.rowTracks    Row tracks, as returned by `getGridTracks`.
 * @param options.columnSpan   Number of columns the block spans, for its default width.
 * @param options.rowSpan      Number of rows the block spans, for its default height.
 * @param options.width        Width of the block in pixels, without its rotation. Defaults to the width of the columns it spans.
 * @param options.height       Height of the block in pixels, without its rotation. Defaults to the height of the rows it spans.
 * @param options.grabX        Where the block was grabbed, in pixels from its left edge. Defaults to its center.
 * @param options.grabY        Where the block was grabbed, in pixels from its top edge. Defaults to its center.
 * @param options.angle        The block's rotation in degrees.
 * @param options.snap         Whether to snap the block's corner to the grid lines.
 *
 * @return Where the block would land, as a place in the grid and in pixels.
 */
export function getFreeGridDropTarget( {
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
	angle = 0,
	snap = false,
}: GridDropTargetOptions & { angle?: number; snap?: boolean } ): {
	placement: GridPlacement;
	pixelRect: PixelRect;
} {
	const bounds = {
		left: 0,
		top: 0,
		right: columnTracks[ columnTracks.length - 1 ].end,
		bottom: rowTracks[ rowTracks.length - 1 ].end,
	};
	const left = x - grabX;
	const top = y - grabY;
	let pixelRect = clampPixelRect(
		{ left, top, right: left + width, bottom: top + height },
		bounds,
		angle
	);
	if ( snap ) {
		pixelRect = clampPixelRect(
			snapPixelRectPosition( pixelRect, columnTracks, rowTracks ),
			bounds,
			angle
		);
	}
	// The block's place is stored without its rotation, so that has to be
	// inside the grid too, even if its rotated outline then reaches out.
	pixelRect = clampPixelRect( pixelRect, bounds );
	return {
		placement: getGridPlacementFromPixelRect(
			pixelRect,
			columnTracks,
			rowTracks
		),
		pixelRect,
	};
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
 * @param options
 * @param options.x            Pointer position in pixels, in the same space as `pixelRect`.
 * @param options.y            Pointer position in pixels, in the same space as `pixelRect`.
 * @param options.pixelRect    The block's rectangle, or null when it isn't in the grid.
 * @param options.isHandleDrag Whether the drag started from the block's drag handle.
 *
 * @return Where the block was grabbed, in pixels from its top-left corner, or nothing to center it.
 */
export function getGrabPoint( {
	x,
	y,
	pixelRect,
	isHandleDrag = false,
}: {
	x: number;
	y: number;
	pixelRect: PixelRect | null;
	isHandleDrag?: boolean;
} ): { grabX?: number; grabY?: number } {
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
 * @param tracks Grid tracks, as returned by `getGridTracks`.
 * @param span   Number of tracks.
 *
 * @return The size in pixels.
 */
function getSpanSize( tracks: GridTrack[], span: number ): number {
	const lastTrack = tracks[ Math.min( span, tracks.length ) - 1 ];
	return lastTrack ? lastTrack.end - tracks[ 0 ].start : 0;
}

/**
 * Converts a range of grid cells to a rectangle in pixels.
 *
 * @param rect         The grid cells.
 * @param columnTracks Column tracks, as returned by `getGridTracks`.
 * @param rowTracks    Row tracks, as returned by `getGridTracks`.
 *
 * @return The rectangle, relative to the first track, or null if the cells are outside the tracks.
 */
export function getPixelRectFromGridRect(
	rect: GridCellRange,
	columnTracks: GridTrack[],
	rowTracks: GridTrack[]
): PixelRect | null {
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
