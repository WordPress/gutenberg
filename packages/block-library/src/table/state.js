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
export function createTable( { rowCount, columnCount } ) {
	return {
		body: Array.from( { length: rowCount } ).map( () => ( {
			cells: Array.from( { length: columnCount } ).map( () => ( {
				content: '',
				tag: 'td',
			} ) ),
		} ) ),
	};
}

/**
 * Returns the first row in the table.
 *
 * @param {Object} state Current table state.
 *
 * @return {Object | undefined} The first table row.
 */
export function getFirstRow( state ) {
	if ( ! isEmptyTableSection( state.head ) ) {
		return state.head[ 0 ];
	}
	if ( ! isEmptyTableSection( state.body ) ) {
		return state.body[ 0 ];
	}
	if ( ! isEmptyTableSection( state.foot ) ) {
		return state.foot[ 0 ];
	}
}

/**
 * Gets an attribute for a cell.
 *
 * @param {Object} state         Current table state.
 * @param {Object} cellLocation  The location of the cell
 * @param {string} attributeName The name of the attribute to get the value of.
 *
 * @return {*} The attribute value.
 */
export function getCellAttribute( state, cellLocation, attributeName ) {
	const { sectionName, rowIndex, columnIndex } = cellLocation;
	return state[ sectionName ]?.[ rowIndex ]?.cells?.[ columnIndex ]?.[
		attributeName
	];
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

	const tableSections = Object.fromEntries(
		Object.entries( state ).filter( ( [ key ] ) =>
			[ 'head', 'body', 'foot' ].includes( key )
		)
	);
	const { sectionName: selectionSectionName, rowIndex: selectionRowIndex } =
		selection;

	return Object.fromEntries(
		Object.entries( tableSections ).map( ( [ sectionName, section ] ) => {
			if (
				selectionSectionName &&
				selectionSectionName !== sectionName
			) {
				return [ sectionName, section ];
			}

			return [
				sectionName,
				section.map( ( row, rowIndex ) => {
					if ( selectionRowIndex && selectionRowIndex !== rowIndex ) {
						return row;
					}

					return {
						cells: row.cells.map(
							( cellAttributes, columnIndex ) => {
								const cellLocation = {
									sectionName,
									columnIndex,
									rowIndex,
								};

								if (
									! isCellSelected( cellLocation, selection )
								) {
									return cellAttributes;
								}

								return updateCell( cellAttributes );
							}
						),
					};
				} ),
			];
		} )
	);
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
			return (
				selection.type === 'column' &&
				cellLocation.columnIndex === selection.columnIndex
			);
		case 'cell':
			return (
				selection.type === 'cell' &&
				cellLocation.sectionName === selection.sectionName &&
				cellLocation.columnIndex === selection.columnIndex &&
				cellLocation.rowIndex === selection.rowIndex
			);
	}
}

/**
 * Parses a `colspan` or `rowspan` value, falling back to 1 when it's missing
 * or invalid.
 *
 * @param {string|number|undefined} value The span value.
 *
 * @return {number} The span as a positive integer.
 */
function getSpan( value ) {
	return Math.max( parseInt( value, 10 ) || 1, 1 );
}

/**
 * Returns a copy of the cell with the given rowspan, omitting the attribute
 * when the cell no longer spans multiple rows.
 *
 * @param {Object} cell    The cell attributes.
 * @param {number} rowspan The new rowspan.
 *
 * @return {Object} The updated cell attributes.
 */
function setCellRowspan( cell, rowspan ) {
	const newCell = { ...cell };
	if ( rowspan > 1 ) {
		newCell.rowspan = String( rowspan );
	} else {
		delete newCell.rowspan;
	}
	return newCell;
}

/**
 * Returns a copy of the cell with the given colspan, omitting the attribute
 * when the cell no longer spans multiple columns.
 *
 * @param {Object} cell    The cell attributes.
 * @param {number} colspan The new colspan.
 *
 * @return {Object} The updated cell attributes.
 */
function setCellColspan( cell, colspan ) {
	const newCell = { ...cell };
	if ( colspan > 1 ) {
		newCell.colspan = String( colspan );
	} else {
		delete newCell.colspan;
	}
	return newCell;
}

/**
 * Calculates the effective column count in a row, accounting for colspan values.
 *
 * @param {Object} row The row object containing cells.
 *
 * @return {number} The effective column count.
 */
function getRowColumnCount( row ) {
	if ( ! row?.cells?.length ) {
		return 0;
	}

	return row.cells.reduce(
		( columnCount, cell ) => columnCount + getSpan( cell.colspan ),
		0
	);
}

/**
 * Gets the cell that covers a specific logical column in a row.
 *
 * @param {Object} row         The row object containing cells.
 * @param {number} columnIndex The logical column index.
 *
 * @return {Object} The cell that covers the specified column, or an empty object.
 */
function getCellAtColumnIndex( row, columnIndex ) {
	if ( ! row?.cells?.length ) {
		return {};
	}

	let currentColumn = 0;

	for ( const cell of row.cells ) {
		const columnEnd = currentColumn + getSpan( cell.colspan );

		if ( columnIndex < columnEnd ) {
			return cell;
		}

		currentColumn = columnEnd;
	}

	return {};
}

/**
 * Computes the logical position of every cell in a table section, taking into
 * account columns occupied by cells spanning down from the rows above.
 *
 * The rowspan is clamped to the end of the section, since a cell can't span
 * across sections.
 *
 * @param {Array} section The table section.
 *
 * @return {Array} For each row, an array with the `columnIndex`, `colspan` and
 *                 `rowspan` of each of its cells.
 */
function getSectionCellPositions( section ) {
	const occupiedColumns = section.map( () => new Set() );

	return section.map( ( row, rowIndex ) => {
		let columnIndex = 0;

		return ( row.cells ?? [] ).map( ( cell ) => {
			while ( occupiedColumns[ rowIndex ].has( columnIndex ) ) {
				columnIndex++;
			}

			const colspan = getSpan( cell.colspan );
			const rowspan = Math.min(
				getSpan( cell.rowspan ),
				section.length - rowIndex
			);

			for ( let r = rowIndex + 1; r < rowIndex + rowspan; r++ ) {
				for ( let c = columnIndex; c < columnIndex + colspan; c++ ) {
					occupiedColumns[ r ].add( c );
				}
			}

			const position = { columnIndex, colspan, rowspan };
			columnIndex += colspan;
			return position;
		} );
	} );
}

/**
 * Lists, for every row of a table section, the cells that cover it: the row's
 * own cells and the cells spanning down into it from the rows above.
 *
 * @param {Array} positions Cell positions from `getSectionCellPositions`.
 *
 * @return {Array} For each row, an array with the `rowIndex` and `cellIndex`
 *                 of each covering cell, and the logical `start` and `end`
 *                 (exclusive) columns it covers.
 */
function getSectionCellCoverage( positions ) {
	const coverage = positions.map( () => [] );

	positions.forEach( ( rowPositions, rowIndex ) => {
		rowPositions.forEach(
			( { columnIndex, colspan, rowspan }, cellIndex ) => {
				for ( let r = rowIndex; r < rowIndex + rowspan; r++ ) {
					coverage[ r ].push( {
						rowIndex,
						cellIndex,
						start: columnIndex,
						end: columnIndex + colspan,
					} );
				}
			}
		);
	} );

	return coverage;
}

/**
 * Returns the logical columns covered by a cell, accounting for colspan and
 * rowspan in the table section.
 *
 * @param {Object} state        Current table state.
 * @param {Object} cellLocation The location of the cell.
 *
 * @return {Object} The logical `columnIndex` where the cell starts, and its `colspan`.
 */
export function getCellColumnRange( state, cellLocation ) {
	const { sectionName, rowIndex, columnIndex } = cellLocation;
	const positions = getSectionCellPositions( state[ sectionName ] ?? [] );
	const position = positions[ rowIndex ]?.[ columnIndex ];

	return {
		columnIndex: position?.columnIndex ?? columnIndex,
		colspan: position?.colspan ?? 1,
	};
}

/**
 * Inserts a row in the table state.
 *
 * @param {Object} state               Current table state.
 * @param {Object} options
 * @param {string} options.sectionName Section in which to insert the row.
 * @param {number} options.rowIndex    Row index at which to insert the row.
 * @param {number} options.columnCount Column count for the table to create.
 *
 * @return {Object} New table state.
 */
export function insertRow( state, { sectionName, rowIndex, columnCount } ) {
	const firstRow = getFirstRow( state );
	const cellCount =
		columnCount === undefined ? getRowColumnCount( firstRow ) : columnCount;

	// Bail early if the function cannot determine how many cells to add.
	if ( ! cellCount ) {
		return state;
	}

	const section = state[ sectionName ];
	const positions = getSectionCellPositions( section );

	// Cells in the rows above that span across the insertion point grow by
	// one row, and the new row skips the columns they cover.
	const coveredColumns = new Set();
	const rowsBefore = section.slice( 0, rowIndex ).map( ( row, index ) => ( {
		...row,
		cells: row.cells.map( ( cell, cellIndex ) => {
			const { columnIndex, colspan, rowspan } =
				positions[ index ][ cellIndex ];

			if ( index + rowspan <= rowIndex ) {
				return cell;
			}

			for ( let c = columnIndex; c < columnIndex + colspan; c++ ) {
				coveredColumns.add( c );
			}

			return { ...cell, rowspan: String( rowspan + 1 ) };
		} ),
	} ) );

	return {
		[ sectionName ]: [
			...rowsBefore,
			{
				cells: Array.from( { length: cellCount } )
					.map( ( _, index ) => {
						const firstCellInColumn = getCellAtColumnIndex(
							firstRow,
							index
						);

						const inheritedAttributes = Object.fromEntries(
							Object.entries( firstCellInColumn ).filter(
								( [ key ] ) =>
									INHERITED_COLUMN_ATTRIBUTES.includes( key )
							)
						);

						return {
							...inheritedAttributes,
							content: '',
							tag: sectionName === 'head' ? 'th' : 'td',
						};
					} )
					.filter( ( _, index ) => ! coveredColumns.has( index ) ),
			},
			...section.slice( rowIndex ),
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
export function deleteRow( state, { sectionName, rowIndex } ) {
	const section = state[ sectionName ];
	const positions = getSectionCellPositions( section );

	// Cells that start in the deleted row and span down move to the next row.
	const movedCells = ( section[ rowIndex ]?.cells ?? [] ).flatMap(
		( cell, cellIndex ) => {
			const { columnIndex, rowspan } = positions[ rowIndex ][ cellIndex ];
			return rowspan > 1
				? [ { columnIndex, cell: setCellRowspan( cell, rowspan - 1 ) } ]
				: [];
		}
	);

	return {
		[ sectionName ]: section
			.map( ( row, index ) => {
				// Cells in the rows above that span into the deleted row shrink by one row.
				if ( index < rowIndex ) {
					return {
						...row,
						cells: row.cells.map( ( cell, cellIndex ) => {
							const { rowspan } = positions[ index ][ cellIndex ];
							return index + rowspan > rowIndex
								? setCellRowspan( cell, rowspan - 1 )
								: cell;
						} ),
					};
				}

				// Place the moved cells among the next row's cells by column.
				if ( index === rowIndex + 1 && movedCells.length ) {
					const cells = row.cells.map( ( cell, cellIndex ) => ( {
						columnIndex:
							positions[ index ][ cellIndex ].columnIndex,
						cell,
					} ) );

					return {
						...row,
						cells: [ ...movedCells, ...cells ]
							.sort( ( a, b ) => a.columnIndex - b.columnIndex )
							.map( ( { cell } ) => cell ),
					};
				}

				return row;
			} )
			.filter( ( row, index ) => index !== rowIndex ),
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
export function insertColumn( state, { columnIndex } ) {
	const tableSections = Object.fromEntries(
		Object.entries( state ).filter( ( [ key ] ) =>
			[ 'head', 'body', 'foot' ].includes( key )
		)
	);

	return Object.fromEntries(
		Object.entries( tableSections ).map( ( [ sectionName, section ] ) => {
			// Bail early if the table section is empty.
			if ( isEmptyTableSection( section ) ) {
				return [ sectionName, section ];
			}

			const positions = getSectionCellPositions( section );
			const coverage = getSectionCellCoverage( positions );

			return [
				sectionName,
				section.map( ( row, rowIndex ) => {
					// Bail early if the row is empty.
					if ( isEmptyRow( row ) ) {
						return row;
					}

					const rowCoverage = coverage[ rowIndex ];
					const rowWidth = Math.max(
						...rowCoverage.map( ( { end } ) => end )
					);

					// Bail early if it's an attempt to insert past the end of the row.
					if ( rowWidth < columnIndex ) {
						return row;
					}

					// A cell spanning across the insertion point grows by one
					// column instead, in the row where it starts. The rows it
					// covers don't get a new cell.
					const spanningCell = rowCoverage.find(
						( { start, end } ) =>
							start < columnIndex && columnIndex < end
					);
					if ( spanningCell ) {
						if ( spanningCell.rowIndex !== rowIndex ) {
							return row;
						}

						return {
							...row,
							cells: row.cells.map( ( cell, cellIndex ) =>
								cellIndex === spanningCell.cellIndex
									? {
											...cell,
											colspan: String(
												getSpan( cell.colspan ) + 1
											),
										}
									: cell
							),
						};
					}

					// Insert the new cell after the cells that start before it.
					const insertAt = positions[ rowIndex ].filter(
						( position ) => position.columnIndex < columnIndex
					).length;

					return {
						...row,
						cells: [
							...row.cells.slice( 0, insertAt ),
							{
								content: '',
								tag: sectionName === 'head' ? 'th' : 'td',
							},
							...row.cells.slice( insertAt ),
						],
					};
				} ),
			];
		} )
	);
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
export function deleteColumn( state, { columnIndex } ) {
	const tableSections = Object.fromEntries(
		Object.entries( state ).filter( ( [ key ] ) =>
			[ 'head', 'body', 'foot' ].includes( key )
		)
	);

	return Object.fromEntries(
		Object.entries( tableSections ).map( ( [ sectionName, section ] ) => {
			// Bail early if the table section is empty.
			if ( isEmptyTableSection( section ) ) {
				return [ sectionName, section ];
			}

			const positions = getSectionCellPositions( section );

			// A cell spanning multiple columns shrinks by one column instead
			// of being removed.
			let newSection = section.map( ( row, rowIndex ) => ( {
				...row,
				cells: row.cells.flatMap( ( cell, cellIndex ) => {
					const { columnIndex: start, colspan } =
						positions[ rowIndex ][ cellIndex ];

					if (
						columnIndex < start ||
						columnIndex >= start + colspan
					) {
						return [ cell ];
					}

					return colspan > 1
						? [ setCellColspan( cell, colspan - 1 ) ]
						: [];
				} ),
			} ) );

			// Remove rows left empty, shrinking the cells above that span into them.
			for (
				let rowIndex = newSection.length - 1;
				rowIndex >= 0;
				rowIndex--
			) {
				if ( isEmptyRow( newSection[ rowIndex ] ) ) {
					newSection = deleteRow(
						{ [ sectionName ]: newSection },
						{ sectionName, rowIndex }
					)[ sectionName ];
				}
			}

			return [ sectionName, newSection ];
		} )
	);
}

/**
 * Toggles the existence of a section.
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

	// Get the column count of the first row of the body to use when creating the header.
	const columnCount = getRowColumnCount( state.body?.[ 0 ] ) || 1;

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
	return ! section || ! section.length || section.every( isEmptyRow );
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
