import { GridRect } from './utils';

/**
 * The smallest width and height, in pixels, of a block inserted into a manual
 * grid. Blocks that start out as a placeholder, such as Image, need about this
 * much room to show it: it's where `Placeholder` switches from its small
 * layout to its medium one.
 */
export const MINIMUM_INSERTION_SIZE = 160;

/**
 * Gets the size in pixels of a range of tracks, including the gaps between
 * them.
 *
 * @param {Array<{start: number, end: number}>} tracks The grid tracks.
 * @param {number}                              start  Index of the first track, starting at 1.
 * @param {number}                              end    Index of the last track, starting at 1.
 *
 * @return {number} The size of the tracks.
 */
function getTracksSize( tracks, start, end ) {
	return tracks[ end - 1 ].end - tracks[ start - 1 ].start;
}

/**
 * Grows a range of cells, where a block is about to be inserted, until it is
 * at least a minimum size in pixels. It grows to the right and down first,
 * then to the left and up, one track at a time and in turn along each axis.
 * It never grows past the grid's tracks or into cells other blocks cover, so
 * it may stay smaller than the minimum. A range that is already big enough is
 * left as it is.
 *
 * @param {Object}                              options
 * @param {GridRect}                            options.rect          The cells the block was inserted into.
 * @param {Array<{start: number, end: number}>} options.columnTracks  The grid's column tracks.
 * @param {Array<{start: number, end: number}>} options.rowTracks     The grid's row tracks.
 * @param {GridRect[]}                          options.occupiedRects The cells other blocks cover.
 * @param {number}                              options.minimumSize   The smallest width and height, in pixels.
 *
 * @return {GridRect} The cells the block should cover.
 */
export function getMinimumInsertionRect( {
	rect,
	columnTracks,
	rowTracks,
	occupiedRects = [],
	minimumSize = MINIMUM_INSERTION_SIZE,
} ) {
	if (
		rect.columnEnd > columnTracks.length ||
		rect.rowEnd > rowTracks.length
	) {
		return rect;
	}

	let { columnStart, columnEnd, rowStart, rowEnd } = rect;

	function isFree( cells ) {
		const cellsRect = new GridRect( cells );
		return ! occupiedRects.some( ( occupiedRect ) =>
			occupiedRect.intersectsRect( cellsRect )
		);
	}

	function growColumns() {
		if (
			columnEnd < columnTracks.length &&
			isFree( {
				columnStart: columnEnd + 1,
				rowStart,
				rowEnd,
			} )
		) {
			columnEnd++;
			return true;
		}
		if (
			columnStart > 1 &&
			isFree( {
				columnStart: columnStart - 1,
				rowStart,
				rowEnd,
			} )
		) {
			columnStart--;
			return true;
		}
		return false;
	}

	function growRows() {
		if (
			rowEnd < rowTracks.length &&
			isFree( {
				columnStart,
				columnEnd,
				rowStart: rowEnd + 1,
			} )
		) {
			rowEnd++;
			return true;
		}
		if (
			rowStart > 1 &&
			isFree( {
				columnStart,
				columnEnd,
				rowStart: rowStart - 1,
			} )
		) {
			rowStart--;
			return true;
		}
		return false;
	}

	let canGrowColumns = true;
	let canGrowRows = true;
	while ( canGrowColumns || canGrowRows ) {
		if ( canGrowColumns ) {
			canGrowColumns =
				getTracksSize( columnTracks, columnStart, columnEnd ) <
					minimumSize && growColumns();
		}
		if ( canGrowRows ) {
			canGrowRows =
				getTracksSize( rowTracks, rowStart, rowEnd ) < minimumSize &&
				growRows();
		}
	}

	return new GridRect( { columnStart, columnEnd, rowStart, rowEnd } );
}
