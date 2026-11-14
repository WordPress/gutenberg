import { GridRect, hasExplicitGridPlacement } from './utils';

export type AutoGridMoveDirection = 'left' | 'right' | 'up' | 'down';

export interface AutoGridItem {
	clientId: string;
	rect: GridRect;
	columnStart?: number;
	rowStart?: number;
}

export interface AutoGridSnapshot {
	columnCount: number;
	rowCount: number;
	items: AutoGridItem[];
}

/**
 * Creates a rectangle at the given position while preserving an item's
 * measured spans.
 *
 * @param item        The grid item being placed.
 * @param columnStart The item's column start.
 * @param rowStart    The item's row start.
 *
 * @return The positioned rectangle.
 */
function getPlacedRect(
	item: AutoGridItem,
	columnStart: number,
	rowStart: number
) {
	return new GridRect( {
		columnStart,
		rowStart,
		columnSpan: item.rect.columnSpan,
		rowSpan: item.rect.rowSpan,
	} );
}

/**
 * Checks whether any cell in a rectangle is already occupied.
 *
 * @param rect     The rectangle to check.
 * @param occupied The occupied cells, keyed as `column:row`.
 *
 * @return Whether the rectangle overlaps an occupied cell.
 */
function occupiesCells( rect: GridRect, occupied: Set< string > ) {
	for ( let row = rect.rowStart; row <= rect.rowEnd; row++ ) {
		for (
			let column = rect.columnStart;
			column <= rect.columnEnd;
			column++
		) {
			if ( occupied.has( `${ column }:${ row }` ) ) {
				return true;
			}
		}
	}
	return false;
}

/**
 * Adds every cell in a rectangle to the set of occupied cells.
 *
 * @param rect     The rectangle to occupy.
 * @param occupied The occupied cells, keyed as `column:row`.
 */
function occupyCells( rect: GridRect, occupied: Set< string > ) {
	for ( let row = rect.rowStart; row <= rect.rowEnd; row++ ) {
		for (
			let column = rect.columnStart;
			column <= rect.columnEnd;
			column++
		) {
			occupied.add( `${ column }:${ row }` );
		}
	}
}

/**
 * Finds the next available rectangle for an item from the auto-placement
 * cursor. The occupied cells are read but not modified.
 *
 * @param item         The grid item being placed.
 * @param columnCount  The number of columns in the measured grid.
 * @param occupied     The occupied cells, keyed as `column:row`.
 * @param cursorColumn The current auto-placement cursor column.
 * @param cursorRow    The current auto-placement cursor row.
 *
 * @return The item's rectangle and the resulting cursor position.
 */
function getNextAutoPlacedRect(
	item: AutoGridItem,
	columnCount: number,
	occupied: Set< string >,
	cursorColumn: number,
	cursorRow: number
) {
	if ( item.columnStart !== undefined ) {
		const previousColumn = cursorColumn;
		cursorColumn = item.columnStart;
		if ( cursorColumn < previousColumn ) {
			cursorRow++;
		}
		let rect = getPlacedRect( item, cursorColumn, cursorRow );
		while ( occupiesCells( rect, occupied ) ) {
			cursorRow++;
			rect = getPlacedRect( item, cursorColumn, cursorRow );
		}
		return { rect, cursorColumn, cursorRow };
	}

	while ( true ) {
		const rect = getPlacedRect( item, cursorColumn, cursorRow );
		if ( rect.columnEnd > columnCount ) {
			cursorColumn = 1;
			cursorRow++;
			continue;
		}
		if ( ! occupiesCells( rect, occupied ) ) {
			return { rect, cursorColumn, cursorRow };
		}
		cursorColumn++;
	}
}

/**
 * Simulates the sparse, row-wise CSS grid auto-placement algorithm once and
 * records where the selected item would land at each position in the shared
 * auto-placement sequence. Items after the selected item can't affect its
 * placement, so this avoids rebuilding the whole grid for every block index.
 *
 * @param items        The grid items in block order.
 * @param selectedItem The auto-placed item being moved.
 * @param columnCount  The number of columns in the measured grid.
 *
 * @return The selected item's rectangle at each sequence position and the IDs
 *         of the other items in that sequence.
 */
function getAutoPlacementCandidates(
	items: AutoGridItem[],
	selectedItem: AutoGridItem,
	columnCount: number
) {
	const placed = new Set< string >();
	const occupied = new Set< string >();

	/**
	 * Marks an item as placed and adds its rectangle to the occupied cells.
	 *
	 * @param item The item being placed.
	 * @param rect The item's positioned rectangle.
	 */
	function place( item: AutoGridItem, rect: GridRect ) {
		placed.add( item.clientId );
		occupyCells( rect, occupied );
	}

	// Fully positioned items occupy their cells before auto-placement starts.
	for ( const item of items ) {
		if ( item.columnStart !== undefined && item.rowStart !== undefined ) {
			place(
				item,
				getPlacedRect( item, item.columnStart, item.rowStart )
			);
		}
	}

	// Items locked to a row are placed before the shared auto-placement cursor.
	// Sparse packing keeps each item after earlier row-locked items in every row
	// it spans, even if an earlier cell is otherwise empty.
	const rowLockedEnds = new Map< number, number >();
	for ( const item of items ) {
		if (
			placed.has( item.clientId ) ||
			item.rowStart === undefined ||
			item.columnStart !== undefined
		) {
			continue;
		}

		let columnStart = 1;
		for (
			let row = item.rowStart;
			row < item.rowStart + item.rect.rowSpan;
			row++
		) {
			columnStart = Math.max(
				columnStart,
				( rowLockedEnds.get( row ) ?? 0 ) + 1
			);
		}

		let rect = getPlacedRect( item, columnStart, item.rowStart );
		while ( occupiesCells( rect, occupied ) ) {
			columnStart++;
			rect = getPlacedRect( item, columnStart, item.rowStart );
		}
		place( item, rect );
		for ( let row = rect.rowStart; row <= rect.rowEnd; row++ ) {
			rowLockedEnds.set( row, rect.columnEnd );
		}
	}

	const autoPlacedItems = items.filter(
		( item ) => ! placed.has( item.clientId ) && item.rowStart === undefined
	);
	const otherAutoPlacedItems = autoPlacedItems.filter(
		( item ) => item.clientId !== selectedItem.clientId
	);
	const placements: GridRect[] = [];
	let cursorColumn = 1;
	let cursorRow = 1;
	for ( const item of otherAutoPlacedItems ) {
		placements.push(
			getNextAutoPlacedRect(
				selectedItem,
				columnCount,
				occupied,
				cursorColumn,
				cursorRow
			).rect
		);
		const placedItem = getNextAutoPlacedRect(
			item,
			columnCount,
			occupied,
			cursorColumn,
			cursorRow
		);
		place( item, placedItem.rect );
		( { cursorColumn, cursorRow } = placedItem );
	}
	placements.push(
		getNextAutoPlacedRect(
			selectedItem,
			columnCount,
			occupied,
			cursorColumn,
			cursorRow
		).rect
	);

	return {
		placements,
		autoPlacedClientIds: new Set(
			otherAutoPlacedItems.map( ( item ) => item.clientId )
		),
	};
}

/**
 * Checks whether two rectangles have the same grid bounds.
 *
 * @param first  The simulated rectangle, if the item was placed.
 * @param second The rectangle to compare it with.
 *
 * @return Whether both rectangles have the same bounds.
 */
function rectsAreEqual( first: GridRect | undefined, second: GridRect ) {
	return (
		first?.columnStart === second.columnStart &&
		first.columnEnd === second.columnEnd &&
		first.rowStart === second.rowStart &&
		first.rowEnd === second.rowEnd
	);
}

/**
 * Checks whether a simulated placement moved along the requested axis while
 * keeping its position on the other axis.
 *
 * @param placed    The simulated rectangle, if the item was placed.
 * @param current   The item's current rectangle.
 * @param direction The requested move direction.
 *
 * @return Whether the simulated rectangle moved in the requested direction.
 */
function movesInDirection(
	placed: GridRect | undefined,
	current: GridRect,
	direction: AutoGridMoveDirection
) {
	if ( ! placed ) {
		return false;
	}
	if ( direction === 'left' || direction === 'right' ) {
		return (
			placed.rowStart === current.rowStart &&
			( direction === 'left'
				? placed.columnStart < current.columnStart
				: placed.columnStart > current.columnStart )
		);
	}
	return (
		placed.columnStart === current.columnStart &&
		( direction === 'up'
			? placed.rowStart < current.rowStart
			: placed.rowStart > current.rowStart )
	);
}

/**
 * Finds a block-order position that auto-places an item at a target rectangle.
 * If spans prevent an exact one-track move, it returns the nearest position
 * that moves in the requested direction without changing the other axis.
 * Explicitly placed items remain positioned and participate as occupied cells
 * in the simulation.
 *
 * @param snapshot      The measured grid state.
 * @param blockOrder    The grid's child block order.
 * @param blockClientId The item being moved.
 * @param target        The requested grid rectangle.
 * @param direction     The requested move direction.
 *
 * @return The block-order index, or undefined when reordering cannot move in
 *         the requested direction.
 */
export function findAutoGridReorderIndex(
	snapshot: AutoGridSnapshot,
	blockOrder: string[],
	blockClientId: string,
	target: GridRect,
	direction: AutoGridMoveDirection
): number | undefined {
	const item = snapshot.items.find(
		( candidate ) => candidate.clientId === blockClientId
	);
	if ( ! item || hasExplicitGridPlacement( item ) ) {
		return undefined;
	}

	if (
		! Number.isInteger( snapshot.columnCount ) ||
		snapshot.columnCount < 1
	) {
		return undefined;
	}

	const itemsByClientId = new Map(
		snapshot.items.map( ( candidate ) => [ candidate.clientId, candidate ] )
	);
	const currentIndex = blockOrder.indexOf( blockClientId );
	if ( currentIndex < 0 ) {
		return undefined;
	}
	const orderedItems = blockOrder
		.map( ( clientId ) => itemsByClientId.get( clientId ) )
		.filter( ( candidate ): candidate is AutoGridItem => !! candidate );
	const { placements, autoPlacedClientIds } = getAutoPlacementCandidates(
		orderedItems,
		item,
		snapshot.columnCount
	);
	const orderWithoutItem = blockOrder.filter(
		( clientId ) => clientId !== blockClientId
	);
	const placementIndexes = [ 0 ];
	for ( const clientId of orderWithoutItem ) {
		placementIndexes.push(
			placementIndexes[ placementIndexes.length - 1 ] +
				( autoPlacedClientIds.has( clientId ) ? 1 : 0 )
		);
	}

	const step = direction === 'right' || direction === 'down' ? 1 : -1;
	let directionalIndex: number | undefined;
	for (
		let targetIndex = currentIndex + step;
		targetIndex >= 0 && targetIndex < blockOrder.length;
		targetIndex += step
	) {
		const placedItem = placements[ placementIndexes[ targetIndex ] ];
		if ( rectsAreEqual( placedItem, target ) ) {
			return targetIndex;
		}
		if (
			directionalIndex === undefined &&
			movesInDirection( placedItem, item.rect, direction )
		) {
			directionalIndex = targetIndex;
		}
	}

	return directionalIndex;
}
