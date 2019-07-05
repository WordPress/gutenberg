/**
 * External dependencies
 */
import { times, get, mapValues, every } from 'lodash';

const SECTION_INDEX = {
	head: 0,
	body: 1,
	foot: 2,
};

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
	columnIndex,
} ) {
	return mapValues( state, ( section, sectionName ) => {
		// Bail early if the table section is empty.
		if ( isEmptyTableSection( section ) ) {
			return section;
		}

		return section.map( ( row ) => {
			// Bail early if the row is empty or it's an attempt to insert past
			// the last possible index of the array.
			if ( isEmptyRow( row ) || row.cells.length < columnIndex ) {
				return row;
			}

			return {
				cells: [
					...row.cells.slice( 0, columnIndex ),
					{
						content: '',
						tag: sectionName === 'head' ? 'th' : 'td',
					},
					...row.cells.slice( columnIndex ),
				],
			};
		} );
	} );
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
	columnIndex,
} ) {
	return mapValues( state, ( section ) => {
		// Bail early if the table section is empty.
		if ( isEmptyTableSection( section ) ) {
			return section;
		}

		return section.map( ( row ) => ( {
			cells: row.cells.length >= columnIndex ? row.cells.filter( ( cell, index ) => index !== columnIndex ) : row.cells,
		} ) ).filter( ( row ) => row.cells.length );
	} );
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
	if ( ! isEmptyTableSection( state[ section ] ) ) {
		return { [ section ]: [] };
	}

	// Get the length of the first row of the body to use when creating the header.
	const columnCount = get( state, [ 'body', 0, 'cells', 'length' ], 1 );

	// Section doesn't exist, insert an empty row to create the section.
	return insertRow( state, { section, rowIndex: 0, columnCount } );
}

/**
 * Determines whether a table section is empty.
 *
 * @param {Object} sectionRows Table section state.
 *
 * @return {boolean} True if the table section is empty, false otherwise.
 */
export function isEmptyTableSection( sectionRows ) {
	return ! sectionRows || ! sectionRows.length || every( sectionRows, isEmptyRow );
}

/**
 * Determines whether a table row is empty.
 *
 * @param {Object} row Table row state.
 *
 * @return {boolean} True if the table section is empty, false otherwise.
 */
export function isEmptyRow( row ) {
	return ! ( row.cells && row.cells.length );
}

export function isAxisInSelectionRange( selection, axisIndex, axisName ) {// Compute the selection at axis level.
	const fromAxisIndex = selection.from[ axisName ];
	const toAxisIndex = selection.to[ axisName ];

	return fromAxisIndex <= axisIndex && toAxisIndex >= axisIndex;
}

export function isCellInSelectionRange( selection, section, rowIndex, columnIndex ) {
	if ( ! selection || selection.type !== 'range' ) {
		return false;
	}

	const cellSectionIndex = SECTION_INDEX[ section ];
	const fromSectionIndex = SECTION_INDEX[ selection.from.section ];
	const toSectionIndex = SECTION_INDEX[ selection.to.section ];

	// Return early if section is not within the range.
	if ( fromSectionIndex > cellSectionIndex || toSectionIndex < cellSectionIndex ) {
		return false;
	}

	// All rows in the body have selected cells if the selection
	// start is in the head and the selection end is in the foot.
	const allRowsInSectionHaveSelection = fromSectionIndex < cellSectionIndex && toSectionIndex > cellSectionIndex;

	// Compute individual cell selection.
	const isRowSelected = allRowsInSectionHaveSelection || isAxisInSelectionRange( selection, rowIndex, 'rowIndex' );
	const isColumnSelected = isAxisInSelectionRange( selection, columnIndex, 'columnIndex' );

	return isRowSelected && isColumnSelected;
}

export function isStartOfSelectionRange( selection, section, axisIndex, axisName ) {
	// The row is not the start of a selection if it's in a different section.
	if ( axisName === 'rowIndex' && section !== selection.from.section ) {
		return false;
	}

	return selection.from[ axisName ] === axisIndex;
}

export function isEndOfSelectionRange( selection, section, axisIndex, axisName ) {
	// The row is not the end of a selection if it's in a different section.
	if ( axisName === 'rowIndex' && section !== selection.to.section ) {
		return false;
	}

	return selection.to[ axisName ] === axisIndex;
}

export function isTopOfSelectionRange( selection, section, rowIndex ) {
	return isStartOfSelectionRange( selection, section, rowIndex, 'rowIndex' );
}

export function isLeftOfSelectionRange( selection, section, columnIndex ) {
	return isStartOfSelectionRange( selection, section, columnIndex, 'columnIndex' );
}

export function isBottomOfSelectionRange( selection, section, rowIndex ) {
	return isEndOfSelectionRange( selection, section, rowIndex, 'rowIndex' );
}

export function isRightOfSelectionRange( selection, section, columnIndex ) {
	return isEndOfSelectionRange( selection, section, columnIndex, 'columnIndex' );
}

export function getVerticalSelectionRangeStart( state, columnIndex = 0 ) {
	const {
		head,
	} = state;
	const isEmptyHead = isEmptyTableSection( head );

	return {
		section: isEmptyHead ? 'body' : 'head',
		rowIndex: 0,
		columnIndex,
	};
}

export function getVerticalSelectionRangeEnd( state, columnIndex ) {
	const {
		body,
		foot,
	} = state;
	const isEmptyFoot = isEmptyTableSection( foot );

	const rows = isEmptyFoot ? body : foot;

	if ( columnIndex === undefined ) {
		columnIndex = isEmptyFoot ? rows[ 0 ].cells.length - 1 : rows[ 0 ].cells.length - 1;
	}

	return {
		section: isEmptyFoot ? 'body' : 'foot',
		rowIndex: isEmptyFoot ? rows.length - 1 : rows.length - 1,
		columnIndex,
	};
}

export function getHorizontalSelectionRangeStart( state, section, rowIndex ) {
	return {
		section,
		rowIndex,
		columnIndex: 0,
	};
}

export function getHorizontalSelectionRangeEnd( state, section, rowIndex ) {
	const rows = state[ section ];

	return {
		section,
		rowIndex,
		columnIndex: rows[ 0 ].cells.length - 1,
	};
}
