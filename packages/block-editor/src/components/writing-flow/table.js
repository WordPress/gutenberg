/**
 * Returns the block-level table cell containing the node, if any. Only cells
 * that are themselves blocks (carrying a data-block attribute) count, so
 * blocks that output tables without inner blocks (like the legacy table) are
 * ignored.
 *
 * @param {Node} node DOM node.
 *
 * @return {HTMLTableCellElement|undefined} The table cell element.
 */
export function getTableCell( node ) {
	const element =
		node.nodeType === node.ELEMENT_NODE ? node : node.parentElement;
	const cell = element?.closest( 'td, th' );
	return cell?.hasAttribute( 'data-block' ) ? cell : undefined;
}

/**
 * Computes the visual layout of a table's cells. `cellIndex` is not
 * span-aware: a cell covered by a rowSpan from above is absent from the
 * row's cells collection, and a colSpan'd cell occupies a single slot in it.
 * Walk the rows tracking occupied slots to derive each cell's visual
 * rectangle.
 *
 * @param {HTMLTableElement} table Table element.
 *
 * @return {Object} Object with `grid` (visual slot to cell element) and
 *                  `rects` (Map of cell element to its visual rectangle).
 */
function getTableCellLayout( table ) {
	const grid = [];
	const rects = new Map();

	for ( let rowIndex = 0; rowIndex < table.rows.length; rowIndex++ ) {
		let columnIndex = 0;
		for ( const cell of table.rows[ rowIndex ].cells ) {
			while ( grid[ rowIndex ]?.[ columnIndex ] ) {
				columnIndex++;
			}
			const rect = {
				startRow: rowIndex,
				endRow: rowIndex + cell.rowSpan - 1,
				startColumn: columnIndex,
				endColumn: columnIndex + cell.colSpan - 1,
			};
			for ( let row = rect.startRow; row <= rect.endRow; row++ ) {
				if ( ! grid[ row ] ) {
					grid[ row ] = [];
				}
				for (
					let column = rect.startColumn;
					column <= rect.endColumn;
					column++
				) {
					grid[ row ][ column ] = cell;
				}
			}
			rects.set( cell, rect );
			columnIndex += cell.colSpan;
		}
	}

	return { grid, rects };
}

/**
 * Returns the client IDs of all block-level cells in the rectangle between
 * two table cells, in document order.
 *
 * @param {HTMLTableCellElement} startCell Starting cell.
 * @param {HTMLTableCellElement} endCell   Ending cell.
 *
 * @return {string[]|undefined} Client IDs in the rectangle, or undefined if
 *                              the cells are not in the same table.
 */
export function getTableCellRectangleClientIds( startCell, endCell ) {
	const table = startCell.closest( 'table' );

	if ( ! table || table !== endCell.closest( 'table' ) ) {
		return;
	}

	const { rects } = getTableCellLayout( table );
	const startRect = rects.get( startCell );
	const endRect = rects.get( endCell );

	if ( ! startRect || ! endRect ) {
		return;
	}

	const startRow = Math.min( startRect.startRow, endRect.startRow );
	const endRow = Math.max( startRect.endRow, endRect.endRow );
	const startColumn = Math.min( startRect.startColumn, endRect.startColumn );
	const endColumn = Math.max( startRect.endColumn, endRect.endColumn );

	const clientIds = [];

	for ( const [ cell, rect ] of rects ) {
		if ( ! cell.hasAttribute( 'data-block' ) ) {
			continue;
		}
		if (
			rect.startRow <= endRow &&
			rect.endRow >= startRow &&
			rect.startColumn <= endColumn &&
			rect.endColumn >= startColumn
		) {
			clientIds.push( cell.getAttribute( 'data-block' ) );
		}
	}

	return clientIds;
}

/**
 * Returns the block-level table cell adjacent to a cell in the given
 * direction: the cell occupying the visual slot past the cell's rectangle.
 * Cells spanning into the slot from any direction count. Returns undefined
 * at the table's edges.
 *
 * @param {HTMLTableCellElement} cell       The cell.
 * @param {boolean}              isReverse  Whether to look up/left rather
 *                                          than down/right.
 * @param {boolean}              isVertical Whether to look by row rather
 *                                          than by column.
 *
 * @return {HTMLTableCellElement|undefined} The neighboring cell element.
 */
export function getTableCellNeighbor( cell, isReverse, isVertical ) {
	const table = cell.closest( 'table' );

	if ( ! table ) {
		return;
	}

	const { grid, rects } = getTableCellLayout( table );
	const rect = rects.get( cell );

	if ( ! rect ) {
		return;
	}

	let row;
	let column;

	if ( isVertical ) {
		row = isReverse ? rect.startRow - 1 : rect.endRow + 1;
		column = rect.startColumn;
	} else {
		row = rect.startRow;
		column = isReverse ? rect.startColumn - 1 : rect.endColumn + 1;
	}

	const neighbor = grid[ row ]?.[ column ];

	return neighbor?.hasAttribute( 'data-block' ) ? neighbor : undefined;
}
