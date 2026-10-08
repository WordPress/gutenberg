import { describe, expect, it } from 'vitest';
import {
	getGridDropTarget,
	getPixelRectFromGridRect,
} from '../get-grid-drop-target';
import { getGridTracks } from '../utils';

// Three 100px columns and three 50px rows, with 10px gaps.
const columnTracks = getGridTracks( '100px 100px 100px', 10 );
const rowTracks = getGridTracks( '50px 50px 50px', 10 );

function toPlain( rect ) {
	return {
		columnStart: rect.columnStart,
		rowStart: rect.rowStart,
		columnSpan: rect.columnSpan,
		rowSpan: rect.rowSpan,
	};
}

describe( 'getGridDropTarget()', () => {
	it( 'lands a 1x1 block in the cell under the pointer', () => {
		expect(
			toPlain(
				getGridDropTarget( {
					x: 230,
					y: 70,
					columnTracks,
					rowTracks,
				} )
			)
		).toEqual( { columnStart: 3, rowStart: 2, columnSpan: 1, rowSpan: 1 } );
	} );

	it( 'treats the pointer as the centre of the block', () => {
		// A 2x2 block centred on the gap corner between cells 2/2 and 3/3.
		expect(
			toPlain(
				getGridDropTarget( {
					x: 215,
					y: 115,
					columnTracks,
					rowTracks,
					columnSpan: 2,
					rowSpan: 2,
				} )
			)
		).toEqual( { columnStart: 2, rowStart: 2, columnSpan: 2, rowSpan: 2 } );
	} );

	it( 'centres the block by its measured size', () => {
		// The cells a block spans give a 100px wide block, which lands in
		// column 2. Measured at 300px wide, its left edge is in column 1.
		const options = { x: 160, y: 25, columnTracks, rowTracks };
		expect( getGridDropTarget( options ).columnStart ).toBe( 2 );
		expect(
			getGridDropTarget( { ...options, width: 300, height: 50 } )
				.columnStart
		).toBe( 1 );
	} );

	it( 'clamps the landing area against the right and bottom edges', () => {
		expect(
			toPlain(
				getGridDropTarget( {
					x: 290,
					y: 160,
					columnTracks,
					rowTracks,
					columnSpan: 2,
					rowSpan: 2,
				} )
			)
		).toEqual( { columnStart: 2, rowStart: 2, columnSpan: 2, rowSpan: 2 } );
	} );

	it( 'clamps the landing area against the left and top edges', () => {
		expect(
			toPlain(
				getGridDropTarget( {
					x: 10,
					y: 10,
					columnTracks,
					rowTracks,
					columnSpan: 2,
					rowSpan: 2,
				} )
			)
		).toEqual( { columnStart: 1, rowStart: 1, columnSpan: 2, rowSpan: 2 } );
	} );

	it( 'starts at the first cell when the block is wider than the grid', () => {
		expect(
			toPlain(
				getGridDropTarget( {
					x: 230,
					y: 10,
					columnTracks,
					rowTracks,
					columnSpan: 5,
				} )
			)
		).toEqual( { columnStart: 1, rowStart: 1, columnSpan: 5, rowSpan: 1 } );
	} );

	it( 'handles uneven track sizes', () => {
		const unevenColumns = getGridTracks( '40px 200px 60px', 10 );
		expect(
			getGridDropTarget( {
				x: 150,
				y: 25,
				columnTracks: unevenColumns,
				rowTracks,
				width: 200,
			} ).columnStart
		).toBe( 2 );
		expect(
			getGridDropTarget( {
				x: 290,
				y: 25,
				columnTracks: unevenColumns,
				rowTracks,
				width: 60,
			} ).columnStart
		).toBe( 3 );
	} );
} );

describe( 'getPixelRectFromGridRect()', () => {
	it( 'converts cells to pixels, excluding the trailing gap', () => {
		expect(
			getPixelRectFromGridRect(
				getGridDropTarget( {
					x: 215,
					y: 70,
					columnTracks,
					rowTracks,
					columnSpan: 2,
				} ),
				columnTracks,
				rowTracks
			)
		).toEqual( { left: 110, top: 60, right: 320, bottom: 110 } );
	} );

	it( 'returns null for cells outside the tracks', () => {
		expect(
			getPixelRectFromGridRect(
				{ columnStart: 3, columnEnd: 4, rowStart: 1, rowEnd: 1 },
				columnTracks,
				rowTracks
			)
		).toBeNull();
	} );
} );
