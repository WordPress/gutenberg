import { GridRect } from './utils';
import {
	getMinimumInsertionRect,
	MINIMUM_INSERTION_HEIGHT,
	MINIMUM_INSERTION_WIDTH,
} from './get-minimum-insertion-rect';
import type { GridTrack } from './get-minimum-insertion-rect';

/** The number of cells a block takes up. */
export interface InsertionSize {
	columnSpan: number;
	rowSpan: number;
}

/**
 * Where a block inserted without a place of its own goes:
 *
 * - `center`: the middle of the grid.
 * - `after`: next to a block, to its right, or else below it.
 * - `before`: next to a block, to its left, or else above it.
 * - `first-free`: the first free cells, in reading order.
 */
export type InsertionPlacement = 'center' | 'after' | 'before' | 'first-free';

/**
 * Gets the number of cells a block inserted into a manual grid takes up, so
 * that it is at least the minimum insertion size, which fits the placeholders
 * of blocks such as Image and Cover. It takes up at most half the grid each
 * way, so in a small grid it can be a single cell. A grid that hasn't been
 * measured gets a single cell.
 *
 * @param options
 * @param options.columnTracks  The grid's column tracks.
 * @param options.rowTracks     The grid's row tracks.
 * @param options.minimumWidth  The smallest width, in pixels.
 * @param options.minimumHeight The smallest height, in pixels.
 *
 * @return The number of cells.
 */
export function getInsertionSize( {
	columnTracks,
	rowTracks,
	minimumWidth = MINIMUM_INSERTION_WIDTH,
	minimumHeight = MINIMUM_INSERTION_HEIGHT,
}: {
	columnTracks?: GridTrack[];
	rowTracks?: GridTrack[];
	minimumWidth?: number;
	minimumHeight?: number;
} ): InsertionSize {
	if ( ! columnTracks?.length || ! rowTracks?.length ) {
		return { columnSpan: 1, rowSpan: 1 };
	}
	const rect = getMinimumInsertionRect( {
		rect: new GridRect( { columnStart: 1, rowStart: 1 } ),
		columnTracks,
		rowTracks,
		minimumWidth,
		minimumHeight,
	} );
	return { columnSpan: rect.columnSpan, rowSpan: rect.rowSpan };
}

function isFree( rect: GridRect, occupiedRects: GridRect[] ): boolean {
	return ! occupiedRects.some( ( occupied ) =>
		occupied.intersectsRect( rect )
	);
}

/**
 * Gets the middle of the grid. A block already starting there pushes the new
 * one a cell down and to the right, as many times as it takes and the grid
 * allows, so that blocks inserted one after the other don't hide each other.
 *
 * @param size          The number of cells.
 * @param columnCount   The grid's number of columns.
 * @param rowCount      The grid's number of rows.
 * @param occupiedRects The cells taken up by blocks.
 *
 * @return The cells.
 */
function getCenteredRect(
	size: InsertionSize,
	columnCount: number,
	rowCount: number,
	occupiedRects: GridRect[]
): GridRect {
	let columnStart = Math.max(
		1,
		Math.floor( ( columnCount - size.columnSpan ) / 2 ) + 1
	);
	let rowStart = Math.max(
		1,
		Math.floor( ( rowCount - size.rowSpan ) / 2 ) + 1
	);
	while (
		occupiedRects.some(
			( occupied ) =>
				occupied.columnStart === columnStart &&
				occupied.rowStart === rowStart
		) &&
		columnStart + size.columnSpan <= columnCount &&
		rowStart + size.rowSpan <= rowCount
	) {
		columnStart++;
		rowStart++;
	}
	return new GridRect( { columnStart, rowStart, ...size } );
}

/**
 * Gets the first free cells below a block, starting in its first column, or
 * further left if the block wouldn't fit in the grid's columns from there.
 * Below the grid's rows is always free, so there always are some.
 *
 * @param size          The number of cells.
 * @param reference     The cells of the block.
 * @param columnCount   The grid's number of columns.
 * @param occupiedRects The cells taken up by blocks.
 *
 * @return The cells.
 */
function getRectBelow(
	size: InsertionSize,
	reference: GridRect,
	columnCount: number,
	occupiedRects: GridRect[]
): GridRect {
	const columnStart = Math.max(
		1,
		Math.min( reference.columnStart, columnCount - size.columnSpan + 1 )
	);
	for ( let rowStart = reference.rowEnd + 1; ; rowStart++ ) {
		const rect = new GridRect( { columnStart, rowStart, ...size } );
		if ( isFree( rect, occupiedRects ) ) {
			return rect;
		}
	}
}

/**
 * Gets the first free cells in reading order: row by row, from the left,
 * inside the grid's columns. Below the grid's rows is always free, so there
 * always are some.
 *
 * @param size          The number of cells.
 * @param columnCount   The grid's number of columns.
 * @param occupiedRects The cells taken up by blocks.
 *
 * @return The cells.
 */
function getFirstFreeRect(
	size: InsertionSize,
	columnCount: number,
	occupiedRects: GridRect[]
): GridRect {
	const lastColumnStart = Math.max( 1, columnCount - size.columnSpan + 1 );
	for ( let rowStart = 1; ; rowStart++ ) {
		for (
			let columnStart = 1;
			columnStart <= lastColumnStart;
			columnStart++
		) {
			const rect = new GridRect( { columnStart, rowStart, ...size } );
			if ( isFree( rect, occupiedRects ) ) {
				return rect;
			}
		}
	}
}

/**
 * Gets the cells for a block inserted into a manual grid without a place of
 * its own. A block inserted from an inserter goes in the middle of the grid.
 * A block added before or after another one, such as by pressing Enter, goes
 * next to it, where the grid has room. Without a block to go next to, it goes
 * in the first free cells.
 *
 * @param options
 * @param options.placement     Where the block goes.
 * @param options.size          The number of cells it takes up.
 * @param options.columnCount   The grid's number of columns.
 * @param options.rowCount      The grid's number of rows.
 * @param options.occupiedRects The cells taken up by the other blocks.
 * @param options.reference     The cells of the block it goes next to.
 *
 * @return The cells.
 */
export function getInsertedBlockRect( {
	placement,
	size,
	columnCount,
	rowCount,
	occupiedRects,
	reference,
}: {
	placement: InsertionPlacement;
	size: InsertionSize;
	columnCount: number;
	rowCount: number;
	occupiedRects: GridRect[];
	reference?: GridRect | null;
} ): GridRect {
	if ( placement === 'center' ) {
		return getCenteredRect( size, columnCount, rowCount, occupiedRects );
	}

	if ( ! reference || placement === 'first-free' ) {
		return getFirstFreeRect( size, columnCount, occupiedRects );
	}

	if ( placement === 'before' ) {
		const left = new GridRect( {
			columnStart: reference.columnStart - size.columnSpan,
			rowStart: reference.rowStart,
			...size,
		} );
		if ( left.columnStart >= 1 && isFree( left, occupiedRects ) ) {
			return left;
		}
		const above = new GridRect( {
			columnStart: Math.max(
				1,
				Math.min(
					reference.columnStart,
					columnCount - size.columnSpan + 1
				)
			),
			rowStart: reference.rowStart - size.rowSpan,
			...size,
		} );
		if ( above.rowStart >= 1 && isFree( above, occupiedRects ) ) {
			return above;
		}
	}

	// After the block, or before it when there is no room there.
	const right = new GridRect( {
		columnStart: reference.columnEnd + 1,
		rowStart: reference.rowStart,
		...size,
	} );
	if ( right.columnEnd <= columnCount && isFree( right, occupiedRects ) ) {
		return right;
	}
	return getRectBelow( size, reference, columnCount, occupiedRects );
}
