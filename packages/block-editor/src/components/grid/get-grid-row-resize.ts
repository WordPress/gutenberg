/**
 * The edge of a grid that is dragged to add or remove rows.
 */
export type GridEdge = 'top' | 'bottom';

/**
 * Where a block is placed in a grid's rows.
 */
export interface GridRowPlacement {
	rowStart?: number;
	rowSpan?: number;
}

/**
 * The result of dragging a grid's top or bottom edge.
 */
export interface GridRowResize {
	/**
	 * The new row count.
	 */
	rowCount: number;
	/**
	 * The number of rows to move each block by.
	 */
	rowShift: number;
}

/**
 * The start and end position in pixels of a grid track.
 */
interface GridTrack {
	start: number;
	end: number;
}

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
 * @param options
 * @param options.rowCount The grid's current number of rows.
 * @param options.children Placement of the grid's blocks.
 * @param options.edge     The edge being dragged.
 * @param options.rowDelta Rows to add, or remove when negative.
 *
 * @return The new row count, and the number of rows to move each block by.
 */
export function getGridRowResize( {
	rowCount,
	children,
	edge,
	rowDelta,
}: {
	rowCount: number | null | undefined;
	children: GridRowPlacement[];
	edge: GridEdge;
	rowDelta: number;
} ): GridRowResize {
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
 * @param rowTracks Row tracks, as returned by `getGridTracks`.
 * @param distance  Distance in pixels, positive when the grid grows.
 * @param gap       The gap between rows in pixels.
 *
 * @return Rows to add, or remove when negative.
 */
export function getRowDeltaFromDistance(
	rowTracks: GridTrack[],
	distance: number,
	gap = 0
): number {
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
