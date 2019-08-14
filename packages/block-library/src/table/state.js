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
export function updateSelectedCellAttributes( state, selection, updateCell ) {
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
	const firstRow = getRow( state, getLocationOfFirstRow( state ) );
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
 * Return the row referenced by the location object.
 *
 * @param {Object} state                   The table state.
 * @param {Object} rowLocation             The row location.
 * @param {string} rowLocation.sectionName The table section that the row belongs to.
 * @param {number} rowLocation.rowIndex    The index of the row within the section.
 *
 * @return {?Object} The row object.
 */
export function getRow( state, { sectionName, rowIndex } ) {
	return get( state, [ sectionName, rowIndex ] );
}

/**
 * Returns the location of the first row in the table.
 *
 * @param {Object} state Current table state.
 *
 * @return {Object} The location of the first table row.
 */
export function getLocationOfFirstRow( state ) {
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
 * Returns the location of the last row in the table.
 *
 * @param {Object} state Current table state.
 *
 * @return {Object} The location of the last table row.
 */
export function getLocationOfLastRow( state ) {
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
 * Returns the location of the cell above.
 *
 * @param {Object} state                    The table state.
 * @param {Object} cellLocation             The cell location.
 * @param {string} cellLocation.sectionName The table section that the cell belongs to.
 * @param {number} cellLocation.rowIndex    The row index for the cell within the section.
 * @param {number} cellLocation.columnIndex The column index for the cell.
 *
 * @return {?Object} The location of the cell above or `undefined` if there isn't one.
 */
export function getLocationOfCellAbove( state, { sectionName, rowIndex, columnIndex } ) {
	const isFirstRow = rowIndex === 0;

	// This is the first row of the first section, return undefined early.
	if ( sectionName === 'head' && isFirstRow ) {
		return;
	}

	// Handle getting the last cell from the previous section.
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

	const previousRowIndex = rowIndex - 1;
	const columnCount = get( state, [ sectionName, previousRowIndex, 'cells', 'length' ], 0 );
	const hasCellAbove = columnIndex < columnCount;

	return hasCellAbove ? {
		sectionName,
		columnIndex,
		rowIndex: previousRowIndex,
	} : undefined;
}

/**
 * Returns the location of the cell below.
 *
 * @param {Object} state                    The table state.
 * @param {Object} cellLocation             The cell location.
 * @param {string} cellLocation.sectionName The table section that the cell belongs to.
 * @param {number} cellLocation.rowIndex    The row index for the cell within the section.
 * @param {number} cellLocation.columnIndex The column index for the cell.
 *
 * @return {?Object} The location of the cell below or `undefined` if there isn't one.
 */
export function getLocationOfCellBelow( state, { sectionName, rowIndex, columnIndex } ) {
	const section = state[ sectionName ];
	const rowCount = section.length;
	const isLastRow = rowIndex === rowCount - 1;

	// This is the last row of the last section, return undefined early.
	if ( sectionName === 'foot' && isLastRow ) {
		return;
	}

	// Handle getting the first cell from the next section.
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

	const nextRowIndex = rowIndex + 1;
	const columnCount = get( state, [ sectionName, nextRowIndex, 'cells', 'length' ], 0 );
	const hasCellBelow = columnIndex < columnCount;

	return hasCellBelow ? {
		sectionName,
		columnIndex,
		rowIndex: rowIndex + 1,
	} : undefined;
}

/**
 * Returns the location of the cell to the right.
 *
 * @param {Object} state                    The table state.
 * @param {Object} cellLocation             The cell location.
 * @param {string} cellLocation.sectionName The table section that the cell belongs to.
 * @param {number} cellLocation.rowIndex    The row index for the cell within the section.
 * @param {number} cellLocation.columnIndex The column index for the cell.
 *
 * @return {?Object} The location of the cell to the right or `undefined` if there isn't one.
 */
export function getLocationOfCellToRight( state, { sectionName, rowIndex, columnIndex } ) {
	const section = state[ sectionName ];
	const columnCount = section[ rowIndex ].cells.length;
	const hasCellToRight = columnIndex < columnCount - 1;

	return hasCellToRight ? {
		sectionName,
		rowIndex,
		columnIndex: columnIndex + 1,
	} : undefined;
}

/**
 * Returns the location of the cell to the left.
 *
 * @param {Object} cellLocation             The cell location.
 * @param {string} cellLocation.sectionName The table section that the cell belongs to.
 * @param {number} cellLocation.rowIndex    The row index for the cell within the section.
 * @param {number} cellLocation.columnIndex The column index for the cell.
 *
 * @return {?Object} The location of the cell to the left or `undefined` if there isn't one.
 */
export function getLocationOfCellToLeft( cellLocation ) {
	const { columnIndex } = cellLocation;
	const hasCellToLeft = columnIndex > 0;

	return hasCellToLeft ? {
		...cellLocation,
		columnIndex: columnIndex - 1,
	} : undefined;
}

/**
 * Returns the location of the first cell in the column.
 *
 * @param {Object} state                    The table state.
 * @param {Object} cellLocation             The cell location.
 * @param {number} cellLocation.columnIndex The column index for the cell.
 *
 * @return {?Object} The location of the first cell in the column or `undefined` if there isn't one.
 */
export function getLocationOfFirstCellInColumn( state, { columnIndex } ) {
	const { sectionName, rowIndex } = getLocationOfFirstRow( state );
	const columnCount = get( state, [ sectionName, rowIndex, 'cells', 'length' ], 0 );
	const hasCellAtStartOfColumn = columnIndex < columnCount;

	return hasCellAtStartOfColumn ? {
		sectionName,
		rowIndex,
		columnIndex,
	} : undefined;
}

/**
 * Returns the location of the last cell in the column.
 *
 * @param {Object} state                    The table state.
 * @param {Object} cellLocation             The cell location.
 * @param {number} cellLocation.columnIndex The column index for the cell.
 *
 * @return {?Object} The location of the last cell in the column or `undefined` if there isn't one.
 */
export function getLocationOfLastCellInColumn( state, { columnIndex } ) {
	const { sectionName, rowIndex } = getLocationOfLastRow( state );
	const columnCount = get( state, [ sectionName, rowIndex, 'cells', 'length' ] );
	const hasCellAtEndOfColumn = !! columnCount && columnIndex < columnCount;

	return hasCellAtEndOfColumn ? {
		sectionName,
		rowIndex,
		columnIndex,
	} : undefined;
}

/**
 * Returns the location of the first cell in the row.
 *
 * @param {Object} cellLocation             The cell location.
 * @param {string} cellLocation.sectionName The table section that the cell belongs to.
 * @param {number} cellLocation.rowIndex    The row index for the cell within the section.
 *
 * @return {?Object} The location of the first cell in the row or `undefined` if there isn't one.
 */
export function getLocationOfFirstCellInRow( { sectionName, rowIndex } ) {
	return {
		sectionName,
		rowIndex,
		columnIndex: 0,
	};
}

/**
 * Returns the location of the last cell in the row.
 *
 * @param {Object} state                    The table state.
 * @param {Object} cellLocation             The cell location.
 * @param {string} cellLocation.sectionName The table section that the cell belongs to.
 * @param {number} cellLocation.rowIndex    The row index for the cell within the section.
 *
 * @return {?Object} The location of the last cell in the row or `undefined` if there isn't one.
 */
export function getLocationOfLastCellInRow( state, { sectionName, rowIndex } ) {
	const columnCount = get( state, [ sectionName, rowIndex, 'cells', 'length' ] );

	return {
		sectionName,
		rowIndex,
		columnIndex: columnCount - 1,
	};
}

/**
 * Returns the location of the first cell in the table.
 *
 * @param {Object} state The table state.
 *
 * @return {Object} The location of the first cell in table.
 */
export function getLocationOfFirstCellInTable( state ) {
	const { sectionName, rowIndex } = getLocationOfFirstRow( state );

	return {
		sectionName,
		rowIndex,
		columnIndex: 0,
	};
}

/**
 * Returns the location of the last cell in the table.
 *
 * @param {Object} state The table state.
 *
 * @return {Object} The location of the last cell in table.
 */
export function getLocationOfLastCellInTable( state ) {
	const { sectionName, rowIndex } = getLocationOfLastRow( state );

	return {
		sectionName,
		rowIndex,
		columnIndex: get( state, [ sectionName, rowIndex, 'cells', 'length' ] ) - 1,
	};
}
