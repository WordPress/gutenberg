import { getTableCellNeighbor, getTableCellRectangleClientIds } from '../table';

/**
 * Builds a table element from a spec. Each cell spec is a string used as
 * both the cell's text and its data-block value, or an object overriding
 * rowSpan, colSpan, or block (whether the cell carries a data-block
 * attribute).
 *
 * @param {Array} rows Row specs, each an array of cell specs.
 *
 * @return {HTMLTableElement} The table element.
 */
function createTable( rows ) {
	const table = document.createElement( 'table' );
	for ( const rowSpec of rows ) {
		const row = table.insertRow();
		for ( const cellSpec of rowSpec ) {
			const {
				id,
				rowSpan = 1,
				colSpan = 1,
				block = true,
			} = typeof cellSpec === 'string' ? { id: cellSpec } : cellSpec;
			const cell = row.insertCell();
			cell.textContent = id;
			cell.rowSpan = rowSpan;
			cell.colSpan = colSpan;
			if ( block ) {
				cell.setAttribute( 'data-block', id );
			}
		}
	}
	return table;
}

function getCell( table, id ) {
	return [ ...table.querySelectorAll( 'td' ) ].find(
		( cell ) => cell.textContent === id
	);
}

describe( 'getTableCellRectangleClientIds', () => {
	it( 'returns the column of cells between the start and end cell', () => {
		const table = createTable( [
			[ 'A', 'B', 'C' ],
			[ 'D', 'E', 'F' ],
			[ 'G', 'H', 'I' ],
		] );

		expect(
			getTableCellRectangleClientIds(
				getCell( table, 'B' ),
				getCell( table, 'H' )
			)
		).toEqual( [ 'B', 'E', 'H' ] );
	} );

	it( 'returns the same cells for a reverse drag', () => {
		const table = createTable( [
			[ 'A', 'B', 'C' ],
			[ 'D', 'E', 'F' ],
			[ 'G', 'H', 'I' ],
		] );

		expect(
			getTableCellRectangleClientIds(
				getCell( table, 'H' ),
				getCell( table, 'B' )
			)
		).toEqual( [ 'B', 'E', 'H' ] );
	} );

	it( 'accounts for a colSpan before the dragged column', () => {
		// C is visually in column 2, but its cellIndex is 1.
		const table = createTable( [
			[ { id: 'A', colSpan: 2 }, 'C' ],
			[ 'D', 'E', 'F' ],
		] );

		expect(
			getTableCellRectangleClientIds(
				getCell( table, 'C' ),
				getCell( table, 'F' )
			)
		).toEqual( [ 'C', 'F' ] );
	} );

	it( 'accounts for a rowSpan from a row above', () => {
		// E and F are visually in columns 1 and 2, but their cellIndex
		// values are 0 and 1.
		const table = createTable( [
			[ { id: 'A', rowSpan: 2 }, 'B', 'C' ],
			[ 'E', 'F' ],
		] );

		expect(
			getTableCellRectangleClientIds(
				getCell( table, 'E' ),
				getCell( table, 'F' )
			)
		).toEqual( [ 'E', 'F' ] );
	} );

	it( 'includes a cell spanning into the rectangle from above', () => {
		const table = createTable( [
			[ 'A', { id: 'B', rowSpan: 2 } ],
			[ 'C' ],
			[ 'E', 'F' ],
		] );

		expect(
			getTableCellRectangleClientIds(
				getCell( table, 'C' ),
				getCell( table, 'F' )
			)
		).toEqual( [ 'B', 'C', 'E', 'F' ] );
	} );

	it( 'includes a merged cell within the rectangle once', () => {
		const table = createTable( [
			[ 'A', 'B', 'C' ],
			[ 'D', { id: 'E', rowSpan: 2, colSpan: 2 } ],
			[ 'G' ],
		] );

		expect(
			getTableCellRectangleClientIds(
				getCell( table, 'B' ),
				getCell( table, 'G' )
			)
		).toEqual( [ 'A', 'B', 'D', 'E', 'G' ] );
	} );

	it( 'accounts for a span above when the drag starts on a shifted merged cell', () => {
		// D is visually in columns 1-2, but its cellIndex is 0.
		const table = createTable( [
			[ { id: 'A', rowSpan: 2 }, 'B', 'C' ],
			[ { id: 'D', colSpan: 2 } ],
		] );

		expect(
			getTableCellRectangleClientIds(
				getCell( table, 'D' ),
				getCell( table, 'C' )
			)
		).toEqual( [ 'B', 'C', 'D' ] );
	} );

	it( 'excludes cells without a data-block attribute', () => {
		const table = createTable( [
			[ 'A', { id: 'B', block: false }, 'C' ],
			[ 'D', 'E', 'F' ],
		] );

		expect(
			getTableCellRectangleClientIds(
				getCell( table, 'A' ),
				getCell( table, 'F' )
			)
		).toEqual( [ 'A', 'C', 'D', 'E', 'F' ] );
	} );

	it( 'returns undefined when the cells are in different tables', () => {
		const tableA = createTable( [ [ 'A' ] ] );
		const tableB = createTable( [ [ 'B' ] ] );

		expect(
			getTableCellRectangleClientIds(
				getCell( tableA, 'A' ),
				getCell( tableB, 'B' )
			)
		).toBeUndefined();
	} );
} );

describe( 'getTableCellNeighbor', () => {
	it( 'returns the adjacent cell in each direction', () => {
		const table = createTable( [
			[ 'A', 'B', 'C' ],
			[ 'D', 'E', 'F' ],
			[ 'G', 'H', 'I' ],
		] );
		const cell = getCell( table, 'E' );

		expect( getTableCellNeighbor( cell, true, true ) ).toBe(
			getCell( table, 'B' )
		);
		expect( getTableCellNeighbor( cell, false, true ) ).toBe(
			getCell( table, 'H' )
		);
		expect( getTableCellNeighbor( cell, true, false ) ).toBe(
			getCell( table, 'D' )
		);
		expect( getTableCellNeighbor( cell, false, false ) ).toBe(
			getCell( table, 'F' )
		);
	} );

	it( 'returns undefined at the table edges', () => {
		const table = createTable( [
			[ 'A', 'B' ],
			[ 'C', 'D' ],
		] );

		expect(
			getTableCellNeighbor( getCell( table, 'A' ), true, true )
		).toBeUndefined();
		expect(
			getTableCellNeighbor( getCell( table, 'C' ), false, true )
		).toBeUndefined();
		expect(
			getTableCellNeighbor( getCell( table, 'A' ), true, false )
		).toBeUndefined();
		expect(
			getTableCellNeighbor( getCell( table, 'B' ), false, false )
		).toBeUndefined();
	} );

	it( 'returns the cell past a colSpan', () => {
		const table = createTable( [
			[ { id: 'A', colSpan: 2 }, 'C' ],
			[ 'D', 'E', 'F' ],
		] );

		expect(
			getTableCellNeighbor( getCell( table, 'A' ), false, false )
		).toBe( getCell( table, 'C' ) );
		expect(
			getTableCellNeighbor( getCell( table, 'C' ), true, false )
		).toBe( getCell( table, 'A' ) );
		expect(
			getTableCellNeighbor( getCell( table, 'A' ), false, true )
		).toBe( getCell( table, 'D' ) );
	} );

	it( 'returns a cell spanning into the adjacent slot', () => {
		const table = createTable( [
			[ { id: 'A', rowSpan: 2 }, 'B' ],
			[ 'C' ],
		] );

		expect(
			getTableCellNeighbor( getCell( table, 'C' ), true, false )
		).toBe( getCell( table, 'A' ) );
		expect(
			getTableCellNeighbor( getCell( table, 'B' ), false, true )
		).toBe( getCell( table, 'C' ) );
	} );

	it( 'returns undefined when the adjacent cell is not a block', () => {
		const table = createTable( [ [ 'A', { id: 'B', block: false } ] ] );

		expect(
			getTableCellNeighbor( getCell( table, 'A' ), false, false )
		).toBeUndefined();
	} );
} );
