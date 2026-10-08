import { GridRect } from './utils';

/**
 * Gets the index of the grid track at a position. A position that falls in
 * the gap after a track belongs to that track, and positions outside the grid
 * belong to the first or last track.
 *
 * @param {Array<{start: number, end: number}>} tracks   Grid tracks, as returned by `getGridTracks`.
 * @param {number}                              position Position in pixels, relative to the start of the first track.
 *
 * @return {number} The 0-based index of the track.
 */
export function getTrackIndexAtPosition( tracks, position ) {
	let index = 0;
	for ( let i = 0; i < tracks.length; i++ ) {
		if ( position >= tracks[ i ].start ) {
			index = i;
		}
	}
	return index;
}

function clamp( value, min, max ) {
	return Math.min( Math.max( value, min ), max );
}

/**
 * Works out which cells a block being dragged over a grid would land in.
 *
 * The cell under the pointer is the cell the block was grabbed by, so a block
 * grabbed by its bottom-right cell keeps that cell under the pointer. The
 * landing area keeps the block's span and is clamped to stay inside the grid.
 *
 * @param {Object}                              options
 * @param {number}                              options.x            Pointer position in pixels, relative to the start of the first column track.
 * @param {number}                              options.y            Pointer position in pixels, relative to the start of the first row track.
 * @param {Array<{start: number, end: number}>} options.columnTracks Column tracks, as returned by `getGridTracks`.
 * @param {Array<{start: number, end: number}>} options.rowTracks    Row tracks, as returned by `getGridTracks`.
 * @param {number}                              options.columnSpan   Number of columns the block spans.
 * @param {number}                              options.rowSpan      Number of rows the block spans.
 * @param {{column: number, row: number}}       options.grabOffset   0-based offset of the grabbed cell inside the block.
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
	grabOffset = { column: 0, row: 0 },
} ) {
	const column =
		getTrackIndexAtPosition( columnTracks, x ) + 1 - grabOffset.column;
	const row = getTrackIndexAtPosition( rowTracks, y ) + 1 - grabOffset.row;
	return new GridRect( {
		columnStart: clamp(
			column,
			1,
			Math.max( 1, columnTracks.length - columnSpan + 1 )
		),
		rowStart: clamp(
			row,
			1,
			Math.max( 1, rowTracks.length - rowSpan + 1 )
		),
		columnSpan,
		rowSpan,
	} );
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
