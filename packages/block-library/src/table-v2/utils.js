import { createBlock } from '@wordpress/blocks';

/**
 * The order in which sections are rendered in the table.
 */
const SECTION_ORDER = [ 'head', 'body', 'foot' ];

/**
 * The HTML tag names for each section.
 */
const SECTION_TAGS = {
	head: 'thead',
	body: 'tbody',
	foot: 'tfoot',
};

function getCellAttributesForRowType( type ) {
	return {
		tag: type === 'head' ? 'th' : 'td',
		scope: type === 'head' ? 'col' : undefined,
		content: '',
	};
}

function createCell( type ) {
	return createBlock(
		'core/table-v2-cell',
		getCellAttributesForRowType( type )
	);
}

function getRowCellOffset( rows, rowIndex ) {
	return rows
		.slice( 0, rowIndex )
		.reduce( ( total, row ) => total + row.cellCount, 0 );
}

function markOccupiedSlots( occupiedSlots, rowIndex, columnIndex, cell ) {
	const { rowSpan = 1, colSpan = 1 } = cell.attributes;

	for ( let rowOffset = 0; rowOffset < rowSpan; rowOffset++ ) {
		const occupiedRowIndex = rowIndex + rowOffset;
		if ( ! occupiedSlots.has( occupiedRowIndex ) ) {
			occupiedSlots.set( occupiedRowIndex, new Set() );
		}
		const occupiedRow = occupiedSlots.get( occupiedRowIndex );
		for ( let columnOffset = 0; columnOffset < colSpan; columnOffset++ ) {
			occupiedRow.add( columnIndex + columnOffset );
		}
	}
}

/**
 * Creates row descriptors and cell blocks for a new table.
 *
 * @param {Object}  options
 * @param {number}  options.rowCount    Number of body rows.
 * @param {number}  options.columnCount Number of columns.
 * @param {boolean} options.hasHeader   Whether to include a header row.
 * @param {boolean} options.hasFooter   Whether to include a footer row.
 * @return {Object} Object with rows and cells.
 */
export function createTable( {
	rowCount,
	columnCount,
	hasHeader = false,
	hasFooter = false,
} ) {
	const rows = [];
	const cells = [];

	if ( hasHeader ) {
		rows.push( { type: 'head', cellCount: columnCount } );
	}

	for ( let row = 0; row < rowCount; row++ ) {
		rows.push( { type: 'body', cellCount: columnCount } );
	}

	if ( hasFooter ) {
		rows.push( { type: 'foot', cellCount: columnCount } );
	}

	for ( const row of rows ) {
		for ( let cellIndex = 0; cellIndex < row.cellCount; cellIndex++ ) {
			cells.push( createCell( row.type ) );
		}
	}

	return { rows, cells };
}

/**
 * Gets row and column placements for the flat table cell list.
 *
 * @param {Array}  rows        Row descriptors.
 * @param {Array}  cells       Cell inner blocks.
 * @param {number} columnCount Number of columns.
 * @return {Array} Cell placement objects.
 */
export function getCellPlacements( rows, cells, columnCount ) {
	const placements = [];
	const occupiedSlots = new Map();
	let cellIndex = 0;

	for ( let rowIndex = 0; rowIndex < rows.length; rowIndex++ ) {
		const row = rows[ rowIndex ];
		let columnIndex = 0;

		for (
			let rowCellIndex = 0;
			rowCellIndex < row.cellCount;
			rowCellIndex++
		) {
			const cell = cells[ cellIndex ];
			if ( ! cell ) {
				break;
			}

			while (
				occupiedSlots.get( rowIndex )?.has( columnIndex ) &&
				columnIndex < columnCount
			) {
				columnIndex++;
			}

			placements.push( {
				cell,
				rowIndex,
				rowType: row.type,
				columnIndex,
			} );
			markOccupiedSlots( occupiedSlots, rowIndex, columnIndex, cell );
			columnIndex++;
			cellIndex++;
		}
	}

	return placements;
}

/**
 * Maps rows and flat cell blocks into renderable table sections.
 *
 * @param {Array} rows  Row descriptors.
 * @param {Array} cells Cell inner blocks.
 * @return {Array} Array of section objects, each with { name, tag, rows }.
 */
export function mapCellsToSections( rows, cells ) {
	const sectionsByName = {};
	let cellIndex = 0;

	for ( const row of rows ) {
		if ( ! sectionsByName[ row.type ] ) {
			sectionsByName[ row.type ] = {
				name: row.type,
				tag: SECTION_TAGS[ row.type ],
				rows: [],
			};
		}

		sectionsByName[ row.type ].rows.push(
			cells.slice( cellIndex, cellIndex + row.cellCount )
		);
		cellIndex += row.cellCount;
	}

	return SECTION_ORDER.filter(
		( sectionName ) => sectionsByName[ sectionName ]
	).map( ( sectionName ) => sectionsByName[ sectionName ] );
}

/**
 * Determines the location of a selected cell block within the table.
 *
 * @param {Array}  rows        Row descriptors.
 * @param {Array}  cells       Cell inner blocks.
 * @param {number} columnCount Number of columns.
 * @param {string} clientId    Selected cell clientId.
 * @return {Object|null} Placement object or null if not found.
 */
export function getCellLocation( rows, cells, columnCount, clientId ) {
	return (
		getCellPlacements( rows, cells, columnCount ).find(
			( placement ) => placement.cell.clientId === clientId
		) || null
	);
}

function doesPlacementIntersectRectangle( placement, rectangle ) {
	const { rowSpan = 1, colSpan = 1 } = placement.cell.attributes;
	const placementEndRow = placement.rowIndex + rowSpan - 1;
	const placementEndColumn = placement.columnIndex + colSpan - 1;

	return (
		placement.rowIndex <= rectangle.endRow &&
		placementEndRow >= rectangle.startRow &&
		placement.columnIndex <= rectangle.endColumn &&
		placementEndColumn >= rectangle.startColumn
	);
}

function getPlacementEndRow( placement ) {
	return placement.rowIndex + ( placement.cell.attributes.rowSpan || 1 ) - 1;
}

function getPlacementEndColumn( placement ) {
	return (
		placement.columnIndex + ( placement.cell.attributes.colSpan || 1 ) - 1
	);
}

function getSelectedPlacementRectangle( placements, selectedClientIds ) {
	const selectedClientIdSet = new Set( selectedClientIds );
	const selectedPlacements = placements.filter( ( placement ) =>
		selectedClientIdSet.has( placement.cell.clientId )
	);

	if ( ! selectedPlacements.length ) {
		return null;
	}

	return {
		selectedPlacements,
		startRow: Math.min(
			...selectedPlacements.map( ( placement ) => placement.rowIndex )
		),
		endRow: Math.max( ...selectedPlacements.map( getPlacementEndRow ) ),
		startColumn: Math.min(
			...selectedPlacements.map( ( placement ) => placement.columnIndex )
		),
		endColumn: Math.max(
			...selectedPlacements.map( getPlacementEndColumn )
		),
	};
}

function getOutsideBorderSides( placement, rectangle ) {
	const sides = [];

	if ( placement.rowIndex === rectangle.startRow ) {
		sides.push( 'top' );
	}
	if ( getPlacementEndColumn( placement ) === rectangle.endColumn ) {
		sides.push( 'right' );
	}
	if ( getPlacementEndRow( placement ) === rectangle.endRow ) {
		sides.push( 'bottom' );
	}
	if ( placement.columnIndex === rectangle.startColumn ) {
		sides.push( 'left' );
	}

	return sides;
}

function areBordersEqual( borderA, borderB ) {
	return JSON.stringify( borderA ) === JSON.stringify( borderB );
}

/**
 * Gets all cells inside the rectangle between two cell blocks.
 *
 * @param {Array}  rows          Row descriptors.
 * @param {Array}  cells         Cell inner blocks.
 * @param {number} columnCount   Number of columns.
 * @param {string} startClientId Starting cell clientId.
 * @param {string} endClientId   Ending cell clientId.
 * @return {Array|null} Client IDs in the rectangular selection, or null if either cell is missing.
 */
export function getCellRectangleClientIds(
	rows,
	cells,
	columnCount,
	startClientId,
	endClientId
) {
	const placements = getCellPlacements( rows, cells, columnCount );
	const startPlacement = placements.find(
		( placement ) => placement.cell.clientId === startClientId
	);
	const endPlacement = placements.find(
		( placement ) => placement.cell.clientId === endClientId
	);

	if ( ! startPlacement || ! endPlacement ) {
		return null;
	}

	const rectangle = {
		startRow: Math.min( startPlacement.rowIndex, endPlacement.rowIndex ),
		endRow: Math.max(
			getPlacementEndRow( startPlacement ),
			getPlacementEndRow( endPlacement )
		),
		startColumn: Math.min(
			startPlacement.columnIndex,
			endPlacement.columnIndex
		),
		endColumn: Math.max(
			getPlacementEndColumn( startPlacement ),
			getPlacementEndColumn( endPlacement )
		),
	};

	return placements
		.filter( ( placement ) =>
			doesPlacementIntersectRectangle( placement, rectangle )
		)
		.map( ( placement ) => placement.cell.clientId );
}

/**
 * Gets per-cell attributes for applying a border to the outside of a selected rectangle.
 *
 * @param {Array}  rows              Row descriptors.
 * @param {Array}  cells             Cell inner blocks.
 * @param {number} columnCount       Number of columns.
 * @param {Array}  selectedClientIds Selected cell client IDs.
 * @param {Object} border            Border value to apply.
 * @return {Object} Attributes keyed by client ID.
 */
export function getCellSelectionOutsideBorderAttributes(
	rows,
	cells,
	columnCount,
	selectedClientIds,
	border
) {
	if ( ! border ) {
		return {};
	}

	const rectangle = getSelectedPlacementRectangle(
		getCellPlacements( rows, cells, columnCount ),
		selectedClientIds
	);

	if ( ! rectangle ) {
		return {};
	}

	return rectangle.selectedPlacements.reduce( ( updates, placement ) => {
		const nextBorder = {
			...placement.cell.attributes.style?.border,
		};
		const sides = getOutsideBorderSides( placement, rectangle );

		if ( ! sides.length ) {
			return updates;
		}

		for ( const side of sides ) {
			nextBorder[ side ] = border;
		}

		updates[ placement.cell.clientId ] = {
			style: {
				...placement.cell.attributes.style,
				border: nextBorder,
			},
		};

		return updates;
	}, {} );
}

/**
 * Gets the shared outside border value for a selected rectangle.
 *
 * @param {Array}  rows              Row descriptors.
 * @param {Array}  cells             Cell inner blocks.
 * @param {number} columnCount       Number of columns.
 * @param {Array}  selectedClientIds Selected cell client IDs.
 * @return {Object|undefined} Shared outside border value, if one exists.
 */
export function getCellSelectionOutsideBorderValue(
	rows,
	cells,
	columnCount,
	selectedClientIds
) {
	const rectangle = getSelectedPlacementRectangle(
		getCellPlacements( rows, cells, columnCount ),
		selectedClientIds
	);

	if ( ! rectangle ) {
		return undefined;
	}

	let outsideBorder;

	for ( const placement of rectangle.selectedPlacements ) {
		const sides = getOutsideBorderSides( placement, rectangle );

		for ( const side of sides ) {
			const sideBorder =
				placement.cell.attributes.style?.border?.[ side ];

			if ( ! sideBorder ) {
				return undefined;
			}

			if ( outsideBorder === undefined ) {
				outsideBorder = sideBorder;
			} else if ( ! areBordersEqual( outsideBorder, sideBorder ) ) {
				return undefined;
			}
		}
	}

	return outsideBorder;
}

/**
 * Inserts a new row into the table.
 *
 * @param {Array}  rows                Row descriptors.
 * @param {Array}  cells               Current cell inner blocks.
 * @param {Object} options             Options.
 * @param {number} options.rowIndex    Row index to insert at.
 * @param {string} options.type        Row type.
 * @param {number} options.columnCount Number of cells to create.
 * @return {Object} Object with rows and cells.
 */
export function insertRow( rows, cells, { rowIndex, type, columnCount } ) {
	const insertIndex = getRowCellOffset( rows, rowIndex );
	const newCells = Array.from( { length: columnCount }, () =>
		createCell( type )
	);

	return {
		rows: [
			...rows.slice( 0, rowIndex ),
			{ type, cellCount: columnCount },
			...rows.slice( rowIndex ),
		],
		cells: [
			...cells.slice( 0, insertIndex ),
			...newCells,
			...cells.slice( insertIndex ),
		],
	};
}

/**
 * Deletes a row from the table.
 *
 * @param {Array}  rows             Row descriptors.
 * @param {Array}  cells            Current cell inner blocks.
 * @param {Object} options          Options.
 * @param {number} options.rowIndex Row index to delete.
 * @return {Object} Object with rows and cells.
 */
export function deleteRow( rows, cells, { rowIndex } ) {
	return deleteRows( rows, cells, {
		startRow: rowIndex,
		endRow: rowIndex,
	} );
}

/**
 * Deletes a range of rows from the table.
 *
 * Cells with rowSpan that start before the range but extend into it
 * have their rowSpan reduced. Cells entirely within the range are removed.
 *
 * @param {Array}  rows             Row descriptors.
 * @param {Array}  cells            Current cell inner blocks.
 * @param {Object} options          Options.
 * @param {number} options.startRow Starting row index to delete.
 * @param {number} options.endRow   Ending row index to delete (inclusive).
 * @return {Object} Object with rows and cells.
 */
export function deleteRows( rows, cells, { startRow, endRow } ) {
	const placements = getCellPlacements(
		rows,
		cells,
		Number.MAX_SAFE_INTEGER
	);

	// Collect client IDs of cells to delete (entirely within the range).
	// Also compute rowSpan reductions for cells that span across the boundary.
	const deletedClientIds = new Set();
	const spanReductions = new Map();

	for ( const placement of placements ) {
		const { rowSpan = 1 } = placement.cell.attributes;
		const placementEndRow = placement.rowIndex + rowSpan - 1;

		// Cell starts within the deleted range.
		if ( placement.rowIndex >= startRow && placement.rowIndex <= endRow ) {
			deletedClientIds.add( placement.cell.clientId );
			continue;
		}

		// Cell starts before the range but extends into it.
		if ( placement.rowIndex < startRow && placementEndRow >= startRow ) {
			const overlap = Math.min( placementEndRow, endRow ) - startRow + 1;
			spanReductions.set( placement.cell.clientId, rowSpan - overlap );
		}
	}

	// Build new cells: remove deleted cells, reduce spans for boundary cells.
	const nextCells = cells
		.filter( ( cell ) => ! deletedClientIds.has( cell.clientId ) )
		.map( ( cell ) => {
			const reduction = spanReductions.get( cell.clientId );
			if ( reduction !== undefined ) {
				return {
					...cell,
					attributes: {
						...cell.attributes,
						rowSpan: reduction,
					},
				};
			}
			return cell;
		} );

	// Remove row descriptors in the range.
	const nextRows = [
		...rows.slice( 0, startRow ),
		...rows.slice( endRow + 1 ),
	];

	return { rows: nextRows, cells: nextCells };
}

/**
 * Inserts a new column into the table.
 *
 * @param {Array}  rows                Row descriptors.
 * @param {Array}  cells               Current cell inner blocks.
 * @param {Object} options             Options.
 * @param {number} options.columnIndex Column index to insert at.
 * @return {Object} Object with rows and cells.
 */
export function insertColumn( rows, cells, { columnIndex } ) {
	const newRows = [];
	const newCells = [];
	let cellIndex = 0;

	for ( const row of rows ) {
		const insertIndex = Math.min( columnIndex, row.cellCount );
		newRows.push( { ...row, cellCount: row.cellCount + 1 } );

		newCells.push( ...cells.slice( cellIndex, cellIndex + insertIndex ) );
		newCells.push( createCell( row.type ) );
		newCells.push(
			...cells.slice( cellIndex + insertIndex, cellIndex + row.cellCount )
		);
		cellIndex += row.cellCount;
	}

	return { rows: newRows, cells: newCells };
}

/**
 * Deletes a column from the table.
 *
 * @param {Array}  rows                Row descriptors.
 * @param {Array}  cells               Current cell inner blocks.
 * @param {Object} options             Options.
 * @param {number} options.columnIndex Column index to delete.
 * @return {Object} Object with rows and cells.
 */
export function deleteColumn( rows, cells, { columnIndex } ) {
	return deleteColumns( rows, cells, {
		startColumn: columnIndex,
		endColumn: columnIndex,
	} );
}

/**
 * Deletes a range of columns from the table.
 *
 * Cells with colSpan that start before the range but extend into it
 * have their colSpan reduced. Cells entirely within the range are removed.
 *
 * @param {Array}  rows                Row descriptors.
 * @param {Array}  cells               Current cell inner blocks.
 * @param {Object} options             Options.
 * @param {number} options.startColumn Starting column index to delete.
 * @param {number} options.endColumn   Ending column index to delete (inclusive).
 * @return {Object} Object with rows and cells.
 */
export function deleteColumns( rows, cells, { startColumn, endColumn } ) {
	const placements = getCellPlacements(
		rows,
		cells,
		Number.MAX_SAFE_INTEGER
	);

	// Collect client IDs of cells to delete (entirely within the range).
	// Also compute colSpan reductions for cells that span across the boundary.
	const deletedClientIds = new Set();
	const spanReductions = new Map();

	for ( const placement of placements ) {
		const { colSpan = 1 } = placement.cell.attributes;
		const placementEndColumn = placement.columnIndex + colSpan - 1;

		// Cell starts within the deleted range.
		if (
			placement.columnIndex >= startColumn &&
			placement.columnIndex <= endColumn
		) {
			deletedClientIds.add( placement.cell.clientId );
			continue;
		}

		// Cell starts before the range but extends into it.
		if (
			placement.columnIndex < startColumn &&
			placementEndColumn >= startColumn
		) {
			const overlap =
				Math.min( placementEndColumn, endColumn ) - startColumn + 1;
			spanReductions.set( placement.cell.clientId, colSpan - overlap );
		}
	}

	// Build new cells: remove deleted cells, reduce spans for boundary cells.
	const nextCells = cells
		.filter( ( cell ) => ! deletedClientIds.has( cell.clientId ) )
		.map( ( cell ) => {
			const reduction = spanReductions.get( cell.clientId );
			if ( reduction !== undefined ) {
				return {
					...cell,
					attributes: {
						...cell.attributes,
						colSpan: reduction,
					},
				};
			}
			return cell;
		} );

	// Update row cellCounts: count remaining cells per row.
	const remainingByRow = new Map();
	for ( const placement of placements ) {
		if ( ! deletedClientIds.has( placement.cell.clientId ) ) {
			remainingByRow.set(
				placement.rowIndex,
				( remainingByRow.get( placement.rowIndex ) || 0 ) + 1
			);
		}
	}

	const nextRows = rows.map( ( row, index ) => ( {
		...row,
		cellCount: remainingByRow.get( index ) ?? row.cellCount,
	} ) );

	return { rows: nextRows, cells: nextCells };
}

/**
 * Toggles a table section (header or footer).
 *
 * @param {Array}  rows                Row descriptors.
 * @param {Array}  cells               Current cell inner blocks.
 * @param {Object} options             Options.
 * @param {string} options.type        Section row type to toggle.
 * @param {number} options.columnCount Number of cells to create.
 * @return {Object} Object with rows and cells.
 */
export function toggleSection( rows, cells, { type, columnCount } ) {
	const hasRowsInSection = rows.some( ( row ) => row.type === type );

	if ( hasRowsInSection ) {
		const nextRows = [];
		const nextCells = [];
		let cellIndex = 0;

		for ( const row of rows ) {
			if ( row.type !== type ) {
				nextRows.push( row );
				nextCells.push(
					...cells.slice( cellIndex, cellIndex + row.cellCount )
				);
			}
			cellIndex += row.cellCount;
		}

		return { rows: nextRows, cells: nextCells };
	}

	return insertRow( rows, cells, {
		rowIndex: type === 'head' ? 0 : rows.length,
		type,
		columnCount,
	} );
}

/**
 * Merges a rectangular selection of cells into a single cell.
 *
 * The top-left cell becomes the merged cell, inheriting rowSpan and colSpan
 * for the full rectangle. All other cells in the selection are removed.
 * Only cells within the same section (head/body/foot) can be merged.
 *
 * @param {Array}  rows              Row descriptors.
 * @param {Array}  cells             Cell inner blocks.
 * @param {number} columnCount       Number of columns.
 * @param {Array}  selectedClientIds Selected cell client IDs.
 * @return {Object|null} Object with rows, cells, and mergedClientId, or null if merge is invalid.
 */
export function mergeCells( rows, cells, columnCount, selectedClientIds ) {
	if ( ! selectedClientIds || selectedClientIds.length < 2 ) {
		return null;
	}

	const placements = getCellPlacements( rows, cells, columnCount );
	const rectangle = getSelectedPlacementRectangle(
		placements,
		selectedClientIds
	);

	if ( ! rectangle ) {
		return null;
	}

	// All selected cells must be in the same section.
	const sectionTypes = new Set(
		rectangle.selectedPlacements.map( ( p ) => p.rowType )
	);
	if ( sectionTypes.size > 1 ) {
		return null;
	}

	// Don't allow merging if any selected cell is already merged.
	const hasMergedCell = rectangle.selectedPlacements.some(
		( p ) =>
			( p.cell.attributes.rowSpan || 1 ) > 1 ||
			( p.cell.attributes.colSpan || 1 ) > 1
	);
	if ( hasMergedCell ) {
		return null;
	}

	const { startRow, endRow, startColumn, endColumn } = rectangle;

	// The top-left cell becomes the merged cell.
	const mergedPlacement = rectangle.selectedPlacements.find(
		( p ) => p.rowIndex === startRow && p.columnIndex === startColumn
	);
	if ( ! mergedPlacement ) {
		return null;
	}

	const mergedClientId = mergedPlacement.cell.clientId;
	const rowSpan = endRow - startRow + 1;
	const colSpan = endColumn - startColumn + 1;

	// Client IDs to remove (all selected except the merged cell).
	const removedClientIds = new Set(
		selectedClientIds.filter( ( id ) => id !== mergedClientId )
	);

	// Build new cells array: keep merged cell (with updated spans), remove others.
	const nextCells = cells
		.map( ( cell ) => {
			if ( cell.clientId === mergedClientId ) {
				return {
					...cell,
					attributes: {
						...cell.attributes,
						rowSpan,
						colSpan,
					},
				};
			}
			return cell;
		} )
		.filter( ( cell ) => ! removedClientIds.has( cell.clientId ) );

	// Count removed cells per row to update cellCount.
	const removedByRow = new Map();
	for ( const placement of rectangle.selectedPlacements ) {
		if ( placement.cell.clientId === mergedClientId ) {
			continue;
		}
		const row = placement.rowIndex;
		removedByRow.set( row, ( removedByRow.get( row ) || 0 ) + 1 );
	}

	const nextRows = rows.map( ( row, index ) => {
		const removed = removedByRow.get( index ) || 0;
		return removed > 0
			? { ...row, cellCount: row.cellCount - removed }
			: row;
	} );

	return { rows: nextRows, cells: nextCells, mergedClientId };
}

/**
 * Unmerges a cell by resetting its rowSpan/colSpan to 1 and creating
 * new cells for each vacated slot.
 *
 * @param {Array}  rows        Row descriptors.
 * @param {Array}  cells       Cell inner blocks.
 * @param {number} columnCount Number of columns.
 * @param {string} clientId    Client ID of the merged cell.
 * @return {Object|null} Object with rows and cells, or null if cell is not merged.
 */
export function unmergeCells( rows, cells, columnCount, clientId ) {
	const placements = getCellPlacements( rows, cells, columnCount );
	const placement = placements.find( ( p ) => p.cell.clientId === clientId );

	if ( ! placement ) {
		return null;
	}

	const { rowSpan = 1, colSpan = 1 } = placement.cell.attributes;

	if ( rowSpan <= 1 && colSpan <= 1 ) {
		return null;
	}

	const { rowIndex, rowType } = placement;

	// Reset the merged cell's spans.
	const resetCell = {
		...placement.cell,
		attributes: {
			...placement.cell.attributes,
			rowSpan: 1,
			colSpan: 1,
		},
	};

	// Build a map of new cells to insert per row (excluding the top-left slot).
	const newCellsByRow = new Map();
	for ( let rowOffset = 0; rowOffset < rowSpan; rowOffset++ ) {
		for ( let colOffset = 0; colOffset < colSpan; colOffset++ ) {
			if ( rowOffset === 0 && colOffset === 0 ) {
				continue;
			}
			const row = rowIndex + rowOffset;
			if ( ! newCellsByRow.has( row ) ) {
				newCellsByRow.set( row, [] );
			}
			newCellsByRow.get( row ).push( createCell( rowType ) );
		}
	}

	// Rebuild the cells array row by row, inserting new cells after the
	// merged cell (or after existing cells in each row).
	const nextCells = [];
	const nextRows = [];
	let cellIndex = 0;

	for ( let rowIdx = 0; rowIdx < rows.length; rowIdx++ ) {
		const row = rows[ rowIdx ];
		const rowCells = cells.slice( cellIndex, cellIndex + row.cellCount );
		const newCellsForRow = newCellsByRow.get( rowIdx ) || [];

		if ( rowIdx === rowIndex ) {
			// The merged cell is in this row. Replace it with the reset cell
			// and append new cells for this row after it.
			const updatedRowCells = rowCells.map( ( cell ) =>
				cell.clientId === clientId ? resetCell : cell
			);
			nextCells.push( ...updatedRowCells, ...newCellsForRow );
		} else {
			// Insert new cells after the last cell in this row.
			nextCells.push( ...rowCells, ...newCellsForRow );
		}

		nextRows.push( {
			...row,
			cellCount: row.cellCount + newCellsForRow.length,
		} );

		cellIndex += row.cellCount;
	}

	return { rows: nextRows, cells: nextCells };
}
