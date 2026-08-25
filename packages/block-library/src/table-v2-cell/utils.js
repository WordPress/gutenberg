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
