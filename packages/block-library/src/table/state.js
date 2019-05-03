/**
 * External dependencies
 */
import { times, get } from 'lodash';

/**
 * Creates a table state.
 *
 * @param {number} options.rowCount    Row count for the table to create.
 * @param {number} options.columnCount Column count for the table to create.
 *
 * @return {Object} New table state.
 */
export function createTable( {
	rowCount,
	columnCount,
} ) {
	return {
		body: times( rowCount, () => ( {
			cells: times( columnCount, () => ( {
				content: '',
				tag: 'td',
			} ) ),
		} ) ),
	};
}

/**
 * Updates cell content in the table state.
 *
 * @param {Object} state               Current table state.
 * @param {string} options.section     Section of the cell to update.
 * @param {number} options.rowIndex    Row index of the cell to update.
 * @param {number} options.columnIndex Column index of the cell to update.
 * @param {Array}  options.content     Content to set for the cell.
 *
 * @return {Object} New table state.
 */
export function updateCellContent( state, {
	section,
	rowIndex,
	columnIndex,
	content,
} ) {
	return {
		[ section ]: state[ section ].map( ( row, currentRowIndex ) => {
			if ( currentRowIndex !== rowIndex ) {
				return row;
			}

			return {
				cells: row.cells.map( ( cell, currentColumnIndex ) => {
					if ( currentColumnIndex !== columnIndex ) {
						return cell;
					}

					return {
						...cell,
						content,
					};
				} ),
			};
		} ),
	};
}

/**
 * Inserts a row in the table state.
 *
 * @param {Object} state            Current table state.
 * @param {string} options.section  Section in which to insert the row.
 * @param {number} options.rowIndex Row index at which to insert the row.
 *
 * @return {Object} New table state.
 */
export function insertRow( state, {
	section,
	rowIndex,
	columnCount,
} ) {
	const cellCount = columnCount || state[ section ][ 0 ].cells.length;

	return {
		[ section ]: [
			...state[ section ].slice( 0, rowIndex ),
			{
				cells: times( cellCount, () => ( {
					content: '',
					tag: section === 'head' ? 'th' : 'td',
				} ) ),
			},
			...state[ section ].slice( rowIndex ),
		],
	};
}

/**
 * Deletes a row from the table state.
 *
 * @param {Object} state            Current table state.
 * @param {string} options.section  Section in which to delete the row.
 * @param {number} options.rowIndex Row index to delete.
 *
 * @return {Object} New table state.
 */
export function deleteRow( state, {
	section,
	rowIndex,
} ) {
	return {
		[ section ]: state[ section ].filter( ( row, index ) => index !== rowIndex ),
	};
}

/**
 * Inserts a column in the table state.
 *
 * @param {Object} state               Current table state.
 * @param {string} options.section     Section in which to insert the column.
 * @param {number} options.columnIndex Column index at which to insert the column.
 *
 * @return {Object} New table state.
 */
export function insertColumn( state, {
	section,
	columnIndex,
} ) {
	return {
		[ section ]: state[ section ].map( ( row ) => ( {
			cells: [
				...row.cells.slice( 0, columnIndex ),
				{
					content: '',
					tag: section === 'head' ? 'th' : 'td',
				},
				...row.cells.slice( columnIndex ),
			],
		} ) ),
	};
}

/**
 * Deletes a column from the table state.
 *
 * @param {Object} state               Current table state.
 * @param {string} options.section     Section in which to delete the column.
 * @param {number} options.columnIndex Column index to delete.
 *
 * @return {Object} New table state.
 */
export function deleteColumn( state, {
	section,
	columnIndex,
} ) {
	return {
		[ section ]: state[ section ].map( ( row ) => ( {
			cells: row.cells.filter( ( cell, index ) => index !== columnIndex ),
		} ) ).filter( ( row ) => row.cells.length ),
	};
}

/**
 * Toggles the existance of a section.
 *
 * @param {Object} state   Current table state.
 * @param {string} section Name of the section to toggle.
 *
 * @return {Object} New table state.
 */
export function toggleSection( state, section ) {
	// Section exists, replace it with an empty row to remove it.
	if ( state[ section ] && state[ section ].length ) {
		return { [ section ]: [] };
	}

	// Get the length of the first row of the body to use when creating the header.
	const columnCount = get( state, [ 'body', 0, 'cells', 'length' ], 1 );

	// Section doesn't exist, insert an empty row to create the section.
	return insertRow( state, { section, rowIndex: 0, columnCount } );
}
