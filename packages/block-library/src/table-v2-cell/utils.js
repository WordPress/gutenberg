/**
 * Builds a span-aware cell placement map from the table's section blocks.
 *
 * A cell covered by a rowSpan from above is absent from its row's inner
 * blocks, and a colSpan'd cell occupies a single slot there, so the visual
 * column of a cell is derived by tracking occupied slots rather than using
 * its index within the row.
 *
 * @param {Array} sections Section blocks, with row blocks in `innerBlocks`.
 *
 * @return {Array} Array of placements:
 *                 { clientId, rowIndex, columnIndex, rowSpan, colSpan, sectionType }.
 */
export function getCellPlacements( sections ) {
	const placements = [];
	const occupiedSlots = new Map();
	let rowIndex = 0;

	for ( const section of sections ) {
		for ( const row of section.innerBlocks ) {
			let columnIndex = 0;
			for ( const cell of row.innerBlocks ) {
				while ( occupiedSlots.get( rowIndex )?.has( columnIndex ) ) {
					columnIndex++;
				}
				const { rowSpan = 1, colSpan = 1 } = cell.attributes;
				placements.push( {
					clientId: cell.clientId,
					rowIndex,
					columnIndex,
					rowSpan,
					colSpan,
					sectionType: section.attributes.type,
				} );
				for ( let rowOffset = 0; rowOffset < rowSpan; rowOffset++ ) {
					const occupiedRowIndex = rowIndex + rowOffset;
					if ( ! occupiedSlots.has( occupiedRowIndex ) ) {
						occupiedSlots.set( occupiedRowIndex, new Set() );
					}
					const occupiedRow = occupiedSlots.get( occupiedRowIndex );
					for (
						let columnOffset = 0;
						columnOffset < colSpan;
						columnOffset++
					) {
						occupiedRow.add( columnIndex + columnOffset );
					}
				}
				columnIndex += colSpan;
			}
			rowIndex++;
		}
	}

	return placements;
}

/**
 * Groups cell placements by row index.
 *
 * @param {Array} cellPlacements Cell placements.
 * @return {Map} Map of row index to the row's placements.
 */
export function groupPlacementsByRow( cellPlacements ) {
	const byRow = new Map();
	for ( const placement of cellPlacements ) {
		if ( ! byRow.has( placement.rowIndex ) ) {
			byRow.set( placement.rowIndex, [] );
		}
		byRow.get( placement.rowIndex ).push( placement );
	}
	return byRow;
}

/**
 * Computes how to split a merged cell: reset its spans and refill the slots
 * it covered with new cells.
 *
 * The cell's own row gets new cells for the remaining columns of the span,
 * inserted right after it. Every other row it spans into gets new cells for
 * all columns of the span, at the raw index matching the cell's visual
 * column.
 *
 * @param {Array}  cellPlacements Span-aware cell placements.
 * @param {string} clientId       Client ID of the merged cell.
 * @return {Object|null} Object with resetClientId and insertionsByRow (Map
 *                       of row index to { insertIndex, count }), or null if
 *                       the cell is not merged.
 */
export function getSplitActions( cellPlacements, clientId ) {
	const placement = cellPlacements.find( ( p ) => p.clientId === clientId );
	if ( ! placement || ( placement.rowSpan <= 1 && placement.colSpan <= 1 ) ) {
		return null;
	}

	const placementsByRow = groupPlacementsByRow( cellPlacements );
	const insertionsByRow = new Map();

	for ( let rowOffset = 0; rowOffset < placement.rowSpan; rowOffset++ ) {
		const rowIndex = placement.rowIndex + rowOffset;
		const rowPlacements = placementsByRow.get( rowIndex ) || [];

		if ( rowOffset === 0 ) {
			insertionsByRow.set( rowIndex, {
				insertIndex:
					rowPlacements.findIndex(
						( p ) => p.clientId === clientId
					) + 1,
				count: placement.colSpan - 1,
			} );
		} else {
			insertionsByRow.set( rowIndex, {
				insertIndex: rowPlacements.filter(
					( p ) => p.columnIndex < placement.columnIndex
				).length,
				count: placement.colSpan,
			} );
		}
	}

	return { resetClientId: clientId, insertionsByRow };
}

/**
 * Computes how to insert a column at a visual column index.
 *
 * A cell spanning across the inserted column grows its colSpan to cover it
 * (via its start row's action) instead of the row gaining a cell, and the
 * rows it spans into get no action. Other rows get a new cell at the raw
 * index matching the visual column.
 *
 * @param {Array}  cellPlacements Span-aware cell placements.
 * @param {number} targetColumn   Visual column index to insert at.
 * @return {Map} Map of row index to { expandClientId, newColSpan } or
 *               { insertIndex }. Rows without an action are left unchanged.
 */
export function getColumnInsertionActions( cellPlacements, targetColumn ) {
	const actionsByRow = new Map();
	const placementsByRow = groupPlacementsByRow( cellPlacements );

	for ( const [ rowIndex, rowPlacements ] of placementsByRow ) {
		// The cell occupying the inserted column's slot, including cells
		// spanning into this row from above.
		const occupying = cellPlacements.find(
			( placement ) =>
				placement.rowIndex <= rowIndex &&
				placement.rowIndex + placement.rowSpan - 1 >= rowIndex &&
				placement.columnIndex <= targetColumn &&
				placement.columnIndex + placement.colSpan - 1 >= targetColumn
		);

		if ( occupying && occupying.columnIndex < targetColumn ) {
			// The column passes through the interior of a merged cell: it
			// grows to cover the column, and every row it spans into gets
			// no new cell.
			if ( occupying.rowIndex === rowIndex ) {
				actionsByRow.set( rowIndex, {
					expandClientId: occupying.clientId,
					newColSpan: occupying.colSpan + 1,
				} );
			}
		} else {
			// The raw insertion index follows from the visual column: the
			// row's cells placed before it come first.
			actionsByRow.set( rowIndex, {
				insertIndex: rowPlacements.filter(
					( placement ) => placement.columnIndex < targetColumn
				).length,
			} );
		}
	}

	return actionsByRow;
}

/**
 * Computes how to insert a row at a visual row index.
 *
 * A cell spanning across the insertion point extends its rowSpan to cover
 * the new row, so the rows below keep their coverage. The new row gets a
 * cell for each column not covered by an extended span.
 *
 * @param {Array}  cellPlacements Span-aware cell placements.
 * @param {number} insertIndex    Visual row index to insert at.
 * @return {Object} Object with cellCount and rowSpanExtensions (Map of
 *                  client ID to new rowSpan).
 */
export function getRowInsertionActions( cellPlacements, insertIndex ) {
	const columnCount = Math.max(
		0,
		...cellPlacements.map(
			( placement ) => placement.columnIndex + placement.colSpan
		)
	);
	const coveredColumns = new Set();
	const rowSpanExtensions = new Map();

	for ( const placement of cellPlacements ) {
		if (
			placement.rowIndex < insertIndex &&
			placement.rowIndex + placement.rowSpan - 1 >= insertIndex
		) {
			for (
				let column = placement.columnIndex;
				column < placement.columnIndex + placement.colSpan;
				column++
			) {
				coveredColumns.add( column );
			}
			rowSpanExtensions.set( placement.clientId, placement.rowSpan + 1 );
		}
	}

	return {
		cellCount: columnCount - coveredColumns.size,
		rowSpanExtensions,
	};
}
