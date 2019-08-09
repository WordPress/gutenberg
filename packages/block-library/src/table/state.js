/**
 * External dependencies
 */
import { times, get, mapValues, every, pick } from 'lodash';

const INHERITED_COLUMN_ATTRIBUTES = [ 'align' ];

/**
 * Creates a table state.
 *
 * @param {Object} options
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

export function getRow( state, { sectionName, rowIndex } ) {
	return get( state, [ sectionName, rowIndex ] );
}

export function getCell( state, { sectionName, rowIndex, columnIndex } ) {
	return get( state, [ sectionName, rowIndex, 'cells', columnIndex ] );
}

/**
 * Returns the first row in the table.
 *
 * @param {Object} state Current table state.
 *
 * @return {Object} The first table row.
 */
export function getFirstRowLocation( state ) {
	let firstSectionName;

	if ( ! isEmptyTableSection( state.head ) ) {
		firstSectionName = 'head';
	} else if ( ! isEmptyTableSection( state.body ) ) {
		firstSectionName = 'body';
	} else if ( ! isEmptyTableSection( state.foot ) ) {
		firstSectionName = 'foot';
	}

	return {
		sectionName: firstSectionName,
		rowIndex: 0,
	};
}

/**
 * Returns the first row in the table.
 *
 * @param {Object} state Current table state.
 *
 * @return {Object} The first table row.
 */
export function getLastRowLocation( state ) {
	let lastSectionName;

	if ( ! isEmptyTableSection( state.foot ) ) {
		lastSectionName = 'foot';
	} else if ( ! isEmptyTableSection( state.body ) ) {
		lastSectionName = 'body';
	} else if ( ! isEmptyTableSection( state.head ) ) {
		lastSectionName = 'head';
	}

	return {
		sectionName: lastSectionName,
		rowIndex: state[ lastSectionName ].length - 1,
	};
}

/**
 * Gets an attribute for a cell.
 *
 * @param {Object} state 		 Current table state.
 * @param {Object} cellLocation  The location of the cell
 * @param {string} attributeName The name of the attribute to get the value of.
 *
 * @return {*} The attribute value.
 */
export function getCellAttribute( state, cellLocation, attributeName ) {
	const {
		sectionName,
		rowIndex,
		columnIndex,
	} = cellLocation;
	return get( state, [ sectionName, rowIndex, 'cells', columnIndex, attributeName ] );
}

/**
 * Returns updated cell attributes after applying the `updateCell` function to the selection.
 *
 * @param {Object}   state      The block attributes.
 * @param {Object}   selection  The selection of cells to update.
 * @param {Function} updateCell A function to update the selected cell attributes.
 *
 * @return {Object} New table state including the updated cells.
 */
export function updateSelectedCell( state, selection, updateCell ) {
	if ( ! selection ) {
		return state;
	}

	const tableSections = pick( state, [ 'head', 'body', 'foot' ] );
	const {
		sectionName: selectionSectionName,
		rowIndex: selectionRowIndex,
	} = selection;

	return mapValues( tableSections, ( section, sectionName ) => {
		if ( selectionSectionName && selectionSectionName !== sectionName ) {
			return section;
		}

		return section.map( ( row, rowIndex ) => {
			if ( selectionRowIndex && selectionRowIndex !== rowIndex ) {
				return row;
			}

			return {
				cells: row.cells.map( ( cellAttributes, columnIndex ) => {
					const cellLocation = {
						sectionName,
						columnIndex,
						rowIndex,
					};

					if ( ! isCellSelected( cellLocation, selection ) ) {
						return cellAttributes;
					}

					return updateCell( cellAttributes );
				} ),
			};
		} );
	} );
}

/**
 * Returns whether the cell at `cellLocation` is included in the selection `selection`.
 *
 * @param {Object} cellLocation An object containing cell location properties.
 * @param {Object} selection    An object containing selection properties.
 *
 * @return {boolean} True if the cell is selected, false otherwise.
 */
export function isCellSelected( cellLocation, selection ) {
	if ( ! cellLocation || ! selection ) {
		return false;
	}

	switch ( selection.type ) {
		case 'column':
			return selection.type === 'column' && cellLocation.columnIndex === selection.columnIndex;
		case 'cell':
			return selection.type === 'cell' &&
				cellLocation.sectionName === selection.sectionName &&
				cellLocation.columnIndex === selection.columnIndex &&
				cellLocation.rowIndex === selection.rowIndex;
	}
}

/**
 * Inserts a row in the table state.
 *
 * @param {Object} state               Current table state.
 * @param {Object} options
 * @param {string} options.sectionName Section in which to insert the row.
 * @param {number} options.rowIndex    Row index at which to insert the row.
 *
 * @return {Object} New table state.
 */
export function insertRow( state, {
	sectionName,
	rowIndex,
	columnCount,
} ) {
	const firstRow = getRow( state, getFirstRowLocation( state ) );
	const cellCount = columnCount === undefined ? get( firstRow, [ 'cells', 'length' ] ) : columnCount;

	// Bail early if the function cannot determine how many cells to add.
	if ( ! cellCount ) {
		return state;
	}

	return {
		[ sectionName ]: [
			...state[ sectionName ].slice( 0, rowIndex ),
			{
				cells: times( cellCount, ( index ) => {
					const firstCellInColumn = get( firstRow, [ 'cells', index ], {} );
					const inheritedAttributes = pick( firstCellInColumn, INHERITED_COLUMN_ATTRIBUTES );

					return {
						...inheritedAttributes,
						content: '',
						tag: sectionName === 'head' ? 'th' : 'td',
					};
				} ),
			},
			...state[ sectionName ].slice( rowIndex ),
		],
	};
}

/**
 * Deletes a row from the table state.
 *
 * @param {Object} state               Current table state.
 * @param {Object} options
 * @param {string} options.sectionName Section in which to delete the row.
 * @param {number} options.rowIndex    Row index to delete.
 *
 * @return {Object} New table state.
 */
export function deleteRow( state, {
	sectionName,
	rowIndex,
} ) {
	return {
		[ sectionName ]: state[ sectionName ].filter( ( row, index ) => index !== rowIndex ),
	};
}

/**
 * Inserts a column in the table state.
 *
 * @param {Object} state               Current table state.
 * @param {Object} options
 * @param {number} options.columnIndex Column index at which to insert the column.
 *
 * @return {Object} New table state.
 */
export function insertColumn( state, {
	columnIndex,
} ) {
	const tableSections = pick( state, [ 'head', 'body', 'foot' ] );

	return mapValues( tableSections, ( section, sectionName ) => {
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
 * @param {Object} options
 * @param {number} options.columnIndex Column index to delete.
 *
 * @return {Object} New table state.
 */
export function deleteColumn( state, {
	columnIndex,
} ) {
	const tableSections = pick( state, [ 'head', 'body', 'foot' ] );

	return mapValues( tableSections, ( section ) => {
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
 * @param {Object} state       Current table state.
 * @param {string} sectionName Name of the section to toggle.
 *
 * @return {Object} New table state.
 */
export function toggleSection( state, sectionName ) {
	// Section exists, replace it with an empty row to remove it.
	if ( ! isEmptyTableSection( state[ sectionName ] ) ) {
		return { [ sectionName ]: [] };
	}

	// Get the length of the first row of the body to use when creating the header.
	const columnCount = get( state, [ 'body', 0, 'cells', 'length' ], 1 );

	// Section doesn't exist, insert an empty row to create the section.
	return insertRow( state, { sectionName, rowIndex: 0, columnCount } );
}

/**
 * Determines whether a table section is empty.
 *
 * @param {Object} section Table section state.
 *
 * @return {boolean} True if the table section is empty, false otherwise.
 */
export function isEmptyTableSection( section ) {
	return ! section || ! section.length || every( section, isEmptyRow );
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

/**
 * Returns the location of the cell above.
 *
 * @param {Object} state        The table state.
 * @param {Object} cellLocation The cell location (section, rowIndex, columnIndex).
 *
 * @return {?Object} The location of the cell above this one or undefined
 *                   if this cell is at the table perimeter.
 */
export function getCellAbove( state, cellLocation ) {
	const { sectionName, rowIndex, columnIndex } = cellLocation;
	const isFirstRow = rowIndex === 0;

	// This is the first row of the first section, return undefined early.
	if ( sectionName === 'head' && isFirstRow ) {
		return;
	}

	// Handle getting the cell from the next section.
	if ( isFirstRow ) {
		const previousSectionName = sectionName === 'foot' ? 'body' : 'head';
		const previousSection = state[ previousSectionName ];

		// There is no previous section, return undefined early.
		if ( isEmptyTableSection( previousSection ) ) {
			return;
		}

		// The previous section doesn't have as many columns, return undefined early.
		const columnCount = previousSection[ 0 ].cells.length;
		if ( columnIndex > columnCount - 1 ) {
			return;
		}

		const lastRowOfPreviousSection = previousSection.length - 1;

		return {
			sectionName: previousSectionName,
			rowIndex: lastRowOfPreviousSection,
			columnIndex,
		};
	}

	return {
		...cellLocation,
		rowIndex: rowIndex - 1,
	};
}

/**
 * Returns the location of the cell below.
 *
 * @param {Object} state        The table state.
 * @param {Object} cellLocation The cell location (section, rowIndex, columnIndex).
 *
 * @return {?Object} The location of the cell below this one or undefined
 *                   if this cell is at the table perimeter.
 */
export function getCellBelow( state, cellLocation ) {
	const { sectionName, rowIndex, columnIndex } = cellLocation;
	const section = state[ sectionName ];
	const rowCount = section.length;
	const isLastRow = rowIndex === rowCount - 1;

	// This is the last row of the last section, return undefined early.
	if ( sectionName === 'foot' && isLastRow ) {
		return;
	}

	// Handle getting the cell from the next section.
	if ( isLastRow ) {
		const nextSectionName = sectionName === 'head' ? 'body' : 'foot';
		const nextSection = state[ nextSectionName ];

		// There is no next section, return undefined early.
		if ( isEmptyTableSection( nextSection ) ) {
			return;
		}

		// The next section doesn't have as many columns, return undefined early.
		const columnCount = nextSection[ 0 ].cells.length;
		if ( columnIndex > columnCount - 1 ) {
			return;
		}

		return {
			sectionName: nextSectionName,
			rowIndex: 0,
			columnIndex,
		};
	}

	return {
		...cellLocation,
		rowIndex: rowIndex + 1,
	};
}

/**
 * Returns the location of the cell to the right.
 *
 * @param {Object} state        The table state.
 * @param {Object} cellLocation The cell location (section, rowIndex, columnIndex).
 *
 * @return {?Object} The location of the cell to the right of this one or undefined
 *                   if this cell is at the table perimeter.
 */
export function getCellToRight( state, cellLocation ) {
	const { sectionName, rowIndex, columnIndex } = cellLocation;
	const section = state[ sectionName ];
	const columnCount = section[ rowIndex ].cells.length;
	const hasCellToRight = columnIndex < columnCount - 1;

	return hasCellToRight ? {
		...cellLocation,
		columnIndex: columnIndex + 1,
	} : undefined;
}

/**
 * Returns the location of the cell to the left.
 *
 * @param {Object} cellLocation The cell location (section, rowIndex, columnIndex).
 *
 * @return {?Object} The location of the cell to the left of this one or undefined
 *                   if this cell is at the table perimeter.
 */
export function getCellToLeft( cellLocation ) {
	const { columnIndex } = cellLocation;
	const hasCellToLeft = columnIndex > 0;

	return hasCellToLeft ? {
		...cellLocation,
		columnIndex: columnIndex - 1,
	} : undefined;
}

export function getFirstCellInColumn( state, { columnIndex } ) {
	const { sectionName, rowIndex } = getFirstRowLocation( state );

	return {
		sectionName,
		rowIndex,
		columnIndex,
	};
}

export function getLastCellInColumn( state, { columnIndex } ) {
	const { sectionName, rowIndex } = getLastRowLocation( state );

	return {
		sectionName,
		rowIndex,
		columnIndex,
	};
}

export function getFirstCellInRow( cellLocation ) {
	const { columnIndex } = cellLocation;
	const hasCellsToLeft = columnIndex > 0;

	return hasCellsToLeft ? {
		...cellLocation,
		columnIndex: 0,
	} : undefined;
}

export function getLastCellInRow( state, cellLocation ) {
	const { sectionName, rowIndex, columnIndex } = cellLocation;
	const columnCount = get( state, [ sectionName, rowIndex, 'cells', 'length' ] );
	const hasCellsToRight = columnIndex < columnCount - 1;

	return hasCellsToRight ? {
		...cellLocation,
		columnIndex: columnCount - 1,
	} : undefined;
}

export function getFirstCellInTable( state ) {
	const { sectionName, rowIndex } = getFirstRowLocation( state );

	return {
		sectionName,
		rowIndex,
		columnIndex: 0,
	};
}

export function getLastCellInTable( state ) {
	const { sectionName, rowIndex } = getLastRowLocation( state );

	return {
		sectionName,
		rowIndex,
		columnIndex: get( state, [ sectionName, rowIndex, 'cells', 'length' ] ) - 1,
	};
}
