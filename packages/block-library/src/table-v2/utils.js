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

/**
 * Derives the grid dimensions from the cell blocks.
 *
 * @param {Array} cells Array of cell inner blocks.
 * @return {Object} Object with columnCount and per-section row counts.
 */
export function getGridDimensions( cells ) {
	let columnCount = 0;
	const sectionRowCounts = { head: 0, body: 0, foot: 0 };

	for ( const cell of cells ) {
		const { column, colSpan = 1, row, section = 'body' } = cell.attributes;
		columnCount = Math.max( columnCount, column + colSpan );
		if ( section in sectionRowCounts ) {
			sectionRowCounts[ section ] = Math.max(
				sectionRowCounts[ section ],
				row + 1
			);
		}
	}

	return { columnCount, sectionRowCounts };
}

/**
 * Maps a flat array of cell inner blocks into a structured table
 * representation with sections and rows.
 *
 * @param {Array} cells Array of cell inner blocks.
 * @return {Array} Array of section objects, each with { name, tag, rows }.
 *                 Each row is an array of cell blocks sorted by column.
 */
export function mapCellsToSections( cells ) {
	// Group cells by section, then by row.
	const sectionMap = {};

	for ( const cell of cells ) {
		const { section = 'body', row = 0 } = cell.attributes;

		if ( ! sectionMap[ section ] ) {
			sectionMap[ section ] = {};
		}
		if ( ! sectionMap[ section ][ row ] ) {
			sectionMap[ section ][ row ] = [];
		}
		sectionMap[ section ][ row ].push( cell );
	}

	// Build the structured output in section order.
	const sections = [];

	for ( const sectionName of SECTION_ORDER ) {
		const rowMap = sectionMap[ sectionName ];
		if ( ! rowMap ) {
			continue;
		}

		const rowIndices = Object.keys( rowMap )
			.map( Number )
			.sort( ( a, b ) => a - b );

		const rows = rowIndices.map( ( rowIndex ) => {
			const rowCells = rowMap[ rowIndex ];
			// Sort cells within the row by column index.
			rowCells.sort(
				( a, b ) => a.attributes.column - b.attributes.column
			);
			return rowCells;
		} );

		sections.push( {
			name: sectionName,
			tag: SECTION_TAGS[ sectionName ],
			rows,
		} );
	}

	return sections;
}

/**
 * Creates an array of cell blocks for a new table.
 *
 * @param {Object}  options
 * @param {number}  options.rowCount    Number of body rows.
 * @param {number}  options.columnCount Number of columns.
 * @param {boolean} options.hasHeader   Whether to include a header row.
 * @param {boolean} options.hasFooter   Whether to include a footer row.
 * @return {Array} Array of cell block objects suitable for createBlock.
 */
export function createTableCells( {
	rowCount,
	columnCount,
	hasHeader = false,
	hasFooter = false,
} ) {
	const cells = [];

	if ( hasHeader ) {
		for ( let col = 0; col < columnCount; col++ ) {
			cells.push(
				createBlock( 'core/table-v2-cell', {
					section: 'head',
					row: 0,
					column: col,
					tag: 'th',
					scope: 'col',
					content: '',
				} )
			);
		}
	}

	for ( let row = 0; row < rowCount; row++ ) {
		for ( let col = 0; col < columnCount; col++ ) {
			cells.push(
				createBlock( 'core/table-v2-cell', {
					section: 'body',
					row,
					column: col,
					tag: 'td',
					content: '',
				} )
			);
		}
	}

	if ( hasFooter ) {
		for ( let col = 0; col < columnCount; col++ ) {
			cells.push(
				createBlock( 'core/table-v2-cell', {
					section: 'foot',
					row: 0,
					column: col,
					tag: 'td',
					content: '',
				} )
			);
		}
	}

	return cells;
}

/**
 * Inserts a new row of cells into the table.
 *
 * @param {Array}  cells               Current cell inner blocks.
 * @param {Object} options
 * @param {string} options.section     Section to insert into ('head', 'body', 'foot').
 * @param {number} options.rowIndex    Row index to insert at (existing rows at this index and above shift up).
 * @param {number} options.columnCount Number of columns (derived if not provided).
 * @return {Array} New array of cell blocks with the row inserted.
 */
export function insertRow(
	cells,
	{ section, rowIndex, columnCount: explicitColumnCount }
) {
	const { columnCount: derivedColumnCount } = getGridDimensions( cells );
	const columnCount = explicitColumnCount || derivedColumnCount;
	const tag = section === 'head' ? 'th' : 'td';

	// Shift existing rows in the same section at or after rowIndex.
	const updatedCells = cells.map( ( cell ) => {
		const attrs = cell.attributes;
		if ( attrs.section === section && attrs.row >= rowIndex ) {
			return {
				...cell,
				attributes: { ...attrs, row: attrs.row + 1 },
			};
		}
		return cell;
	} );

	// Create new cells for the inserted row.
	const newCells = [];
	for ( let col = 0; col < columnCount; col++ ) {
		newCells.push(
			createBlock( 'core/table-v2-cell', {
				section,
				row: rowIndex,
				column: col,
				tag,
				scope: tag === 'th' ? 'col' : undefined,
				content: '',
			} )
		);
	}

	return [ ...updatedCells, ...newCells ];
}

/**
 * Deletes a row from the table.
 *
 * @param {Array}  cells            Current cell inner blocks.
 * @param {Object} options
 * @param {string} options.section  Section to delete from.
 * @param {number} options.rowIndex Row index to delete.
 * @return {Array} New array of cell blocks with the row removed.
 */
export function deleteRow( cells, { section, rowIndex } ) {
	return cells
		.filter( ( cell ) => {
			const attrs = cell.attributes;
			return ! ( attrs.section === section && attrs.row === rowIndex );
		} )
		.map( ( cell ) => {
			const attrs = cell.attributes;
			if ( attrs.section === section && attrs.row > rowIndex ) {
				return {
					...cell,
					attributes: { ...attrs, row: attrs.row - 1 },
				};
			}
			return cell;
		} );
}

/**
 * Inserts a new column into the table.
 *
 * @param {Array}  cells               Current cell inner blocks.
 * @param {Object} options
 * @param {number} options.columnIndex Column index to insert at.
 * @return {Array} New array of cell blocks with the column inserted.
 */
export function insertColumn( cells, { columnIndex } ) {
	// Shift existing columns at or after columnIndex.
	const updatedCells = cells.map( ( cell ) => {
		const attrs = cell.attributes;
		if ( attrs.column >= columnIndex ) {
			return {
				...cell,
				attributes: { ...attrs, column: attrs.column + 1 },
			};
		}
		return cell;
	} );

	// Determine which section/row combinations exist.
	const existingRows = new Map();
	for ( const cell of cells ) {
		const { section = 'body', row = 0 } = cell.attributes;
		const key = `${ section }:${ row }`;
		if ( ! existingRows.has( key ) ) {
			existingRows.set( key, { section, row } );
		}
	}

	// Create a new cell for each existing row.
	const newCells = [];
	for ( const { section, row } of existingRows.values() ) {
		const tag = section === 'head' ? 'th' : 'td';
		newCells.push(
			createBlock( 'core/table-v2-cell', {
				section,
				row,
				column: columnIndex,
				tag,
				scope: tag === 'th' ? 'col' : undefined,
				content: '',
			} )
		);
	}

	return [ ...updatedCells, ...newCells ];
}

/**
 * Deletes a column from the table.
 *
 * @param {Array}  cells               Current cell inner blocks.
 * @param {Object} options
 * @param {number} options.columnIndex Column index to delete.
 * @return {Array} New array of cell blocks with the column removed.
 */
export function deleteColumn( cells, { columnIndex } ) {
	return cells
		.filter( ( cell ) => cell.attributes.column !== columnIndex )
		.map( ( cell ) => {
			const attrs = cell.attributes;
			if ( attrs.column > columnIndex ) {
				return {
					...cell,
					attributes: { ...attrs, column: attrs.column - 1 },
				};
			}
			return cell;
		} );
}

/**
 * Toggles a table section (header or footer).
 * If the section has cells, removes them. If it doesn't, creates a row.
 *
 * @param {Array}  cells           Current cell inner blocks.
 * @param {Object} options
 * @param {string} options.section Section to toggle ('head' or 'foot').
 * @return {Array} New array of cell blocks.
 */
export function toggleSection( cells, { section } ) {
	const hasCellsInSection = cells.some(
		( cell ) => cell.attributes.section === section
	);

	if ( hasCellsInSection ) {
		// Remove all cells in the section.
		return cells.filter( ( cell ) => cell.attributes.section !== section );
	}

	// Add a single row to the section.
	const { columnCount } = getGridDimensions( cells );
	const tag = section === 'head' ? 'th' : 'td';

	const newCells = [];
	for ( let col = 0; col < columnCount; col++ ) {
		newCells.push(
			createBlock( 'core/table-v2-cell', {
				section,
				row: 0,
				column: col,
				tag,
				scope: tag === 'th' ? 'col' : undefined,
				content: '',
			} )
		);
	}

	return [ ...cells, ...newCells ];
}

/**
 * Determines the location (section, row, column) of a selected cell block
 * within the table's inner blocks.
 *
 * @param {Array}  cells          Array of cell inner blocks.
 * @param {string} selectedCellId The clientId of the selected cell.
 * @return {Object|null} Object with { section, row, column } or null if not found.
 */
export function getSelectedCellLocation( cells, selectedCellId ) {
	for ( const cell of cells ) {
		if ( cell.clientId === selectedCellId ) {
			return {
				section: cell.attributes.section,
				row: cell.attributes.row,
				column: cell.attributes.column,
			};
		}
	}
	return null;
}

/**
 * Sorts cell blocks in the canonical order:
 * head rows first, then body, then foot; within each section by row, then column.
 *
 * @param {Array} cells Array of cell blocks.
 * @return {Array} Sorted array of cell blocks.
 */
export function sortCells( cells ) {
	const sectionWeight = { head: 0, body: 1, foot: 2 };
	return [ ...cells ].sort( ( a, b ) => {
		const aAttrs = a.attributes;
		const bAttrs = b.attributes;

		const sectionDiff =
			( sectionWeight[ aAttrs.section ] || 1 ) -
			( sectionWeight[ bAttrs.section ] || 1 );
		if ( sectionDiff !== 0 ) {
			return sectionDiff;
		}

		const rowDiff = ( aAttrs.row || 0 ) - ( bAttrs.row || 0 );
		if ( rowDiff !== 0 ) {
			return rowDiff;
		}

		return ( aAttrs.column || 0 ) - ( bAttrs.column || 0 );
	} );
}
