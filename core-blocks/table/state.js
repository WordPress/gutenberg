/**
 * External dependencies
 */
import { times } from 'lodash';

export function createTable( {
	rowCount,
	columnCount,
} ) {
	return {
		body: times( rowCount, () => ( {
			cells: times( columnCount, () => ( {
				content: [],
				tag: 'td',
			} ) ),
		} ) ),
	};
}

export function updateCellContent( state, {
	section,
	rowIndex,
	columnIndex,
	content,
} ) {
	return {
		[ section ]: state[ section ].map( ( row, i ) => {
			if ( i !== rowIndex ) {
				return row;
			}

			return {
				cells: row.cells.map( ( cell, ii ) => {
					if ( ii !== columnIndex ) {
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
					content: [],
					tag: 'td',
				} ) ),
			},
			...state[ section ].slice( rowIndex ),
		],
	};
}

export function deleteRow( state, {
	section,
	rowIndex,
} ) {
	return {
		[ section ]: state[ section ].filter( ( row, index ) => index !== rowIndex ),
	};
}

export function insertColumn( state, {
	section,
	columnIndex,
} ) {
	return {
		[ section ]: state[ section ].map( ( row ) => ( {
			cells: [
				...row.cells.slice( 0, columnIndex ),
				{
					content: [],
					tag: 'td',
				},
				...row.cells.slice( columnIndex ),
			],
		} ) ),
	};
}

export function deleteColumn( state, {
	section,
	columnIndex,
} ) {
	return {
		[ section ]: state[ section ].map( ( row ) => ( {
			cells: row.cells.filter( ( cell, index ) => index !== columnIndex ),
		} ) ),
	};
}
