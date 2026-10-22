import { GridRect } from './utils';

/** A grid track, in pixels from the start of the first track. */
export interface GridTrack {
	start: number;
	end: number;
}

/**
 * The smallest width and height, in pixels, of a block inserted into a manual
 * grid, so that blocks that start out as a placeholder, such as Image, can
 * show it. Narrower than 160px, `Placeholder` switches to its small layout,
 * which has no buttons. In its medium layout, the placeholders of Image,
 * Video, Gallery, Audio, File and Embed are up to 240px tall, and Cover's,
 * whose color swatches wrap when it's narrower, needs about 300px each way.
 */
export const MINIMUM_INSERTION_WIDTH = 300;
export const MINIMUM_INSERTION_HEIGHT = 300;

/**
 * Gets the size in pixels of a range of tracks, including the gaps between
 * them, rounded so that a fraction of a pixel doesn't cost a track.
 *
 * @param tracks The grid tracks.
 * @param start  Index of the first track, starting at 1.
 * @param end    Index of the last track, starting at 1.
 *
 * @return The size of the tracks.
 */
function getTracksSize(
	tracks: GridTrack[],
	start: number,
	end: number
): number {
	return Math.round( tracks[ end - 1 ].end - tracks[ start - 1 ].start );
}

/**
 * Gets the most tracks a block inserted into a grid should take up along one
 * axis: half of them, so that a minimum size never fills a small grid, and at
 * least one.
 *
 * @param count The number of tracks in the grid.
 *
 * @return The most tracks to take up.
 */
export function getMaximumInsertionSpan( count: number ): number {
	return Math.max( 1, Math.floor( count / 2 ) );
}

/**
 * Grows a range of tracks until it is at least a minimum size in pixels: it
 * adds tracks after it, then, at the end of the grid, before it. It stops
 * growing at a maximum number of tracks.
 *
 * @param tracks  The grid tracks.
 * @param start   Index of the first track, starting at 1.
 * @param end     Index of the last track, starting at 1.
 * @param minimum The smallest size, in pixels.
 * @param maximum The most tracks.
 *
 * @return The first and last track of the grown range.
 */
function growTracks(
	tracks: GridTrack[],
	start: number,
	end: number,
	minimum: number,
	maximum: number
): [ number, number ] {
	while (
		getTracksSize( tracks, start, end ) < minimum &&
		end - start + 1 < maximum
	) {
		if ( end < tracks.length ) {
			end++;
		} else if ( start > 1 ) {
			start--;
		} else {
			break;
		}
	}
	return [ start, end ];
}

/**
 * Grows a range of cells, where a block is about to be inserted, until it is
 * at least a minimum width and height in pixels. It grows to the right and
 * down, then, at the edges of the grid, to the left and up. It covers other
 * blocks if it has to, but never grows past half of the grid's tracks, so in a
 * small grid it may stay smaller than the minimum. A range that is already big
 * enough is left as it is.
 *
 * @param options
 * @param options.rect          The cells the block was inserted into.
 * @param options.columnTracks  The grid's column tracks.
 * @param options.rowTracks     The grid's row tracks.
 * @param options.minimumWidth  The smallest width, in pixels.
 * @param options.minimumHeight The smallest height, in pixels.
 *
 * @return The cells the block should cover.
 */
export function getMinimumInsertionRect( {
	rect,
	columnTracks,
	rowTracks,
	minimumWidth = MINIMUM_INSERTION_WIDTH,
	minimumHeight = MINIMUM_INSERTION_HEIGHT,
}: {
	rect: GridRect;
	columnTracks: GridTrack[];
	rowTracks: GridTrack[];
	minimumWidth?: number;
	minimumHeight?: number;
} ): GridRect {
	if (
		rect.columnEnd > columnTracks.length ||
		rect.rowEnd > rowTracks.length
	) {
		return rect;
	}
	const [ columnStart, columnEnd ] = growTracks(
		columnTracks,
		rect.columnStart,
		rect.columnEnd,
		minimumWidth,
		getMaximumInsertionSpan( columnTracks.length )
	);
	const [ rowStart, rowEnd ] = growTracks(
		rowTracks,
		rect.rowStart,
		rect.rowEnd,
		minimumHeight,
		getMaximumInsertionSpan( rowTracks.length )
	);
	return new GridRect( { columnStart, columnEnd, rowStart, rowEnd } );
}
