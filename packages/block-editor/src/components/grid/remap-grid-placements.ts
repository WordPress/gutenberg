import {
	EDGE_EPSILON,
	extendTracks,
	getEqualTracks,
	getGridPlacementFromPixelRect,
	getPixelRectFromGridPlacement,
	type GridPlacement,
	type GridTrack,
	type PixelRect,
} from './free-placement';

/**
 * Gets the height of the content of a grid whose cells have a fixed size.
 * The grid takes its height from its width with `aspect-ratio: columns /
 * rows`, which applies to its border box when it has `box-sizing:
 * border-box`, so its padding and borders are part of that size.
 *
 * @param aspectWidth  The width the aspect ratio applies to, in pixels.
 * @param heightOffset What the aspect ratio's height includes besides the content, in pixels.
 * @param columnCount  Number of columns.
 * @param rowCount     Number of rows.
 *
 * @return The content height in pixels.
 */
function getFixedContentHeight(
	aspectWidth: number,
	heightOffset: number,
	columnCount: number,
	rowCount: number
): number {
	return ( aspectWidth * rowCount ) / columnCount - heightOffset;
}

/**
 * Gets the row tracks of a grid whose cells have a fixed size: its rows
 * share its content height, with gaps between them.
 *
 * @param aspectWidth  The width the aspect ratio applies to, in pixels.
 * @param heightOffset What the aspect ratio's height includes besides the content, in pixels.
 * @param columnCount  Number of columns.
 * @param rowCount     Number of rows.
 * @param rowGap       Row gap in pixels.
 *
 * @return The row tracks.
 */
function getFixedRowTracks(
	aspectWidth: number,
	heightOffset: number,
	columnCount: number,
	rowCount: number,
	rowGap: number
): GridTrack[] {
	return getEqualTracks( {
		count: rowCount,
		size: getFixedContentHeight(
			aspectWidth,
			heightOffset,
			columnCount,
			rowCount
		),
		gap: rowGap,
	} );
}

/**
 * Gets the places of a manual grid's blocks for a new number of columns, so
 * that each block stays where it is on screen, at the same size. The grid's
 * cells keep a fixed size, so changing the number of columns changes their
 * size too, and the grid gets as many rows as keep it about as tall, or more
 * if a block needs them.
 *
 * Blocks without a start are left out, as the grid places them itself.
 *
 * @param options
 * @param options.width          The grid's width in pixels, without its padding.
 * @param options.columnGap      Column gap in pixels.
 * @param options.rowGap         Row gap in pixels.
 * @param options.columnCount    The current number of columns.
 * @param options.rowCount       The current number of rows.
 * @param options.newColumnCount The new number of columns.
 * @param options.placements     The blocks' places, keyed by client ID.
 * @param options.aspectWidth    The width the grid's aspect ratio applies to, which includes its padding and borders when it has `box-sizing: border-box`.
 * @param options.heightOffset   What the aspect ratio's height includes besides the content, such as vertical padding and borders.
 *
 * @return The new number of rows, and the blocks' new places.
 */
export function getColumnCountChangeUpdates( {
	width,
	columnGap,
	rowGap,
	columnCount,
	rowCount,
	newColumnCount,
	placements,
	aspectWidth = width,
	heightOffset = 0,
}: {
	width: number;
	/** The width the grid's aspect ratio applies to. Defaults to `width`. */
	aspectWidth?: number;
	/** What the aspect ratio's height includes besides the content, such as vertical padding. */
	heightOffset?: number;
	columnGap: number;
	rowGap: number;
	columnCount: number;
	rowCount: number;
	newColumnCount: number;
	placements: Record< string, GridPlacement >;
} ): { rowCount: number; placements: Record< string, GridPlacement > } {
	const columnTracks = getEqualTracks( {
		count: columnCount,
		size: width,
		gap: columnGap,
	} );
	const placed = Object.entries( placements ).filter(
		( [ , placement ] ) => placement?.columnStart && placement?.rowStart
	);
	// Blocks can be in rows past the grid's last one, which are the same
	// size as the others.
	const lastRow = Math.max(
		rowCount,
		...placed.map(
			( [ , placement ] ) =>
				placement.rowStart + ( placement.rowSpan ?? 1 ) - 1
		)
	);
	const rowTracks = getFixedRowTracks(
		aspectWidth,
		heightOffset,
		columnCount,
		rowCount,
		rowGap
	);
	const lastRowTrack = rowTracks[ rowTracks.length - 1 ];
	const allRowTracks = extendTracks(
		rowTracks,
		lastRowTrack.end +
			( lastRow - rowCount ) *
				( lastRowTrack.end - lastRowTrack.start + rowGap ),
		rowGap
	);

	const pixelRects: Array< [ string, PixelRect ] > = [];
	for ( const [ clientId, placement ] of placed ) {
		const pixelRect = getPixelRectFromGridPlacement(
			placement,
			columnTracks,
			allRowTracks
		);
		if ( pixelRect ) {
			pixelRects.push( [ clientId, pixelRect ] );
		}
	}

	// As many rows as keep the grid about as tall, or more for the lowest
	// block.
	const bottom = Math.max(
		0,
		...pixelRects.map( ( [ , pixelRect ] ) => pixelRect.bottom )
	);
	let newRowCount = Math.max(
		1,
		Math.ceil( ( rowCount * newColumnCount ) / columnCount - 1e-6 )
	);
	while (
		getFixedContentHeight(
			aspectWidth,
			heightOffset,
			newColumnCount,
			newRowCount
		) <
		bottom - EDGE_EPSILON
	) {
		newRowCount++;
	}

	const newColumnTracks = getEqualTracks( {
		count: newColumnCount,
		size: width,
		gap: columnGap,
	} );
	const newRowTracks = getFixedRowTracks(
		aspectWidth,
		heightOffset,
		newColumnCount,
		newRowCount,
		rowGap
	);
	const newPlacements: Record< string, GridPlacement > = {};
	for ( const [ clientId, pixelRect ] of pixelRects ) {
		newPlacements[ clientId ] = getGridPlacementFromPixelRect(
			pixelRect,
			newColumnTracks,
			newRowTracks
		);
	}
	return { rowCount: newRowCount, placements: newPlacements };
}
