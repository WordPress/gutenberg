/**
 * External dependencies
 */
import { times } from 'lodash';

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
} ) {
	const cellCount = state[ section ][ 0 ].cells.length;

	return {
		[ section ]: [
			...state[ section ].slice( 0, rowIndex ),
			{
				cells: times( cellCount, () => ( {
					content: '',
					tag: 'td',
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
					tag: 'td',
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
 * Get the integer value of a style property.
 *
 * @param {?string} rawValue The style's raw value (e.g. 100%, 25px).
 *
 * @return {?number} The integer value (e.g. 100, 25).
 */
export function getStyleValue( rawValue ) {
	const parsedValue = parseInt( rawValue, 10 );

	if ( isNaN( parsedValue ) ) {
		return;
	}

	return parsedValue;
}

/**
 * Get the px or % unit from a style value.
 *
 * @param {?string} value The style's value (e.g. 100px, 25%).
 *
 * @return {?string} The unit (e.g. px, %).
 */
export function getStyleUnit( value ) {
	const match = /(px|%)/i.exec( value );

	if ( ! match ) {
		return;
	}

	return match[ 1 ].toLowerCase();
}

/**
 * Given the table block attributes, return the style properties.
 *
 * @param {?string} attributes.width  The width value.
 * @param {?string} attributes.height The height value.
 *
 * @return {?Object} The style properties.
 */
export function getTableStyles( { width, height } ) {
	if ( ! width && ! height ) {
		return;
	}

	return {
		width: width ? width : undefined,
		height: height ? height : undefined,
	};
}
