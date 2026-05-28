/**
 * WordPress dependencies
 */
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
	const deleteIndex = getRowCellOffset( rows, rowIndex );
	const cellCount = rows[ rowIndex ]?.cellCount || 0;

	return {
		rows: [ ...rows.slice( 0, rowIndex ), ...rows.slice( rowIndex + 1 ) ],
		cells: [
			...cells.slice( 0, deleteIndex ),
			...cells.slice( deleteIndex + cellCount ),
		],
	};
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
	const newRows = [];
	const newCells = [];
	let cellIndex = 0;

	for ( const row of rows ) {
		const deleteIndex = Math.min( columnIndex, row.cellCount - 1 );
		newRows.push( { ...row, cellCount: row.cellCount - 1 } );

		newCells.push( ...cells.slice( cellIndex, cellIndex + deleteIndex ) );
		newCells.push(
			...cells.slice(
				cellIndex + deleteIndex + 1,
				cellIndex + row.cellCount
			)
		);
		cellIndex += row.cellCount;
	}

	return { rows: newRows, cells: newCells };
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
