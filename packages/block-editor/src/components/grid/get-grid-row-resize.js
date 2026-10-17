/**
 * Works out the new row count of a grid whose top or bottom edge is dragged,
 * and how far its blocks move.
 *
 * Dragging the bottom edge adds or removes rows at the bottom, but never rows
 * that a block is in. Dragging the top edge adds or removes rows at the top,
 * and moves every block by the same number of rows, so blocks keep their
 * place relative to each other and to the grid's bottom edge while the grid
 * grows or shrinks above them. Rows can only be removed from the top while
 * they are empty.
 *
 * @param {Object}                                       options
 * @param {number}                                       options.rowCount The grid's current number of rows.
 * @param {Array<{rowStart?: number, rowSpan?: number}>} options.children Placement of the grid's blocks.
 * @param {'top'|'bottom'}                               options.edge     The edge being dragged.
 * @param {number}                                       options.rowDelta Rows to add, or remove when negative.
 *
 * @return {{rowCount: number, rowShift: number}} The new row count, and the number of rows to move each block by.
 */
export function getGridRowResize( { rowCount, children, edge, rowDelta } ) {
	let topRow = Infinity;
	let bottomRow = 1;
	for ( const { rowStart, rowSpan = 1 } of children ) {
		if ( ! rowStart ) {
			continue;
		}
		topRow = Math.min( topRow, rowStart );
		bottomRow = Math.max( bottomRow, rowStart + rowSpan - 1 );
	}
	const currentRowCount = Math.max( rowCount || 1, bottomRow );

	if ( edge === 'top' ) {
		if ( rowDelta >= 0 ) {
			return { rowCount: currentRowCount + rowDelta, rowShift: rowDelta };
		}
		const emptyTopRows =
			topRow === Infinity ? currentRowCount - 1 : topRow - 1;
		const removedRows = Math.min( -rowDelta, emptyTopRows );
		return {
			rowCount: currentRowCount - removedRows,
			rowShift: -removedRows,
		};
	}

	return {
		rowCount: Math.max( currentRowCount + rowDelta, bottomRow, 1 ),
		rowShift: 0,
	};
}

/**
 * Converts the distance an edge of a grid was dragged into a number of rows.
 *
 * @param {Array<{start: number, end: number}>} rowTracks Row tracks, as returned by `getGridTracks`.
 * @param {number}                              distance  Distance in pixels, positive when the grid grows.
 * @param {number}                              gap       The gap between rows in pixels.
 *
 * @return {number} Rows to add, or remove when negative.
 */
export function getRowDeltaFromDistance( rowTracks, distance, gap = 0 ) {
	if ( ! rowTracks.length ) {
		return 0;
	}
	const lastTrack = rowTracks[ rowTracks.length - 1 ];
	const rowPitch =
		( lastTrack.end - rowTracks[ 0 ].start + gap ) / rowTracks.length;
	if ( ! rowPitch ) {
		return 0;
	}
	return Math.round( distance / rowPitch );
}
