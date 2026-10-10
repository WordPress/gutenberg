import { describe, expect, it } from 'vitest';
import {
	GridRect,
	getBoundingGridRect,
	getGridRectFromPixelRect,
	getGridTracks,
	getRowEndForResize,
} from '../utils';

describe( 'getBoundingGridRect()', () => {
	it( 'spans from one cell to another', () => {
		const rect = getBoundingGridRect(
			new GridRect( { columnStart: 2, rowStart: 1 } ),
			new GridRect( { columnStart: 4, rowStart: 3 } )
		);
		expect( rect ).toMatchObject( {
			columnStart: 2,
			rowStart: 1,
			columnEnd: 4,
			rowEnd: 3,
			columnSpan: 3,
			rowSpan: 3,
		} );
	} );

	it( 'gives the same cells whichever way round the cells are', () => {
		// Dragged up and to the left, then down and to the left.
		const start = new GridRect( { columnStart: 4, rowStart: 3 } );
		const expected = {
			columnStart: 2,
			rowStart: 1,
			columnEnd: 4,
			rowEnd: 3,
		};
		expect(
			getBoundingGridRect(
				start,
				new GridRect( { columnStart: 2, rowStart: 1 } )
			)
		).toMatchObject( expected );
		expect(
			getBoundingGridRect(
				new GridRect( { columnStart: 4, rowStart: 1 } ),
				new GridRect( { columnStart: 2, rowStart: 3 } )
			)
		).toMatchObject( expected );
	} );

	it( 'is one cell when both cells are the same', () => {
		const cell = new GridRect( { columnStart: 3, rowStart: 2 } );
		expect( getBoundingGridRect( cell, cell ) ).toMatchObject( {
			columnStart: 3,
			rowStart: 2,
			columnSpan: 1,
			rowSpan: 1,
		} );
	} );

	it( 'contains ranges that span several cells', () => {
		const rect = getBoundingGridRect(
			new GridRect( {
				columnStart: 1,
				rowStart: 2,
				columnSpan: 2,
				rowSpan: 1,
			} ),
			new GridRect( {
				columnStart: 2,
				rowStart: 1,
				columnSpan: 1,
				rowSpan: 3,
			} )
		);
		expect( rect ).toMatchObject( {
			columnStart: 1,
			rowStart: 1,
			columnEnd: 2,
			rowEnd: 3,
		} );
	} );
} );

// Three 100px columns and three 50px rows, with 10px gaps. Rows are 0-50,
// 60-110 and 120-170.
const columnTracks = getGridTracks( '100px 100px 100px', 10 );
const rowTracks = getGridTracks( '50px 50px 50px', 10 );

function toPlain( rect ) {
	return {
		columnStart: rect.columnStart,
		rowStart: rect.rowStart,
		columnEnd: rect.columnEnd,
		rowEnd: rect.rowEnd,
	};
}

describe( 'getGridRectFromPixelRect()', () => {
	it( 'gets the cells a rectangle fills exactly', () => {
		expect(
			toPlain(
				getGridRectFromPixelRect(
					{ left: 110, top: 60, right: 320, bottom: 110 },
					columnTracks,
					rowTracks
				)
			)
		).toEqual( { columnStart: 2, rowStart: 2, columnEnd: 3, rowEnd: 2 } );
	} );

	it( 'snaps each edge to the closest track', () => {
		expect(
			toPlain(
				getGridRectFromPixelRect(
					{ left: 20, top: 50, right: 190, bottom: 160 },
					columnTracks,
					rowTracks
				)
			)
		).toEqual( { columnStart: 1, rowStart: 2, columnEnd: 2, rowEnd: 3 } );
	} );

	it( 'keeps rectangles past the grid on its edge tracks', () => {
		expect(
			toPlain(
				getGridRectFromPixelRect(
					{ left: -40, top: -40, right: 500, bottom: 400 },
					columnTracks,
					rowTracks
				)
			)
		).toEqual( { columnStart: 1, rowStart: 1, columnEnd: 3, rowEnd: 3 } );
	} );
} );

describe( 'getRowEndForResize()', () => {
	it( 'snaps to the closest row inside the grid', () => {
		expect( getRowEndForResize( rowTracks, 100, 10 ) ).toBe( 2 );
		expect( getRowEndForResize( rowTracks, 165, 10 ) ).toBe( 3 );
	} );

	it( 'stays on the last row when dragged a little past it', () => {
		expect( getRowEndForResize( rowTracks, 190, 10 ) ).toBe( 3 );
	} );

	it( 'adds a row for every row height dragged past the end', () => {
		expect( getRowEndForResize( rowTracks, 230, 10 ) ).toBe( 4 );
		expect( getRowEndForResize( rowTracks, 290, 10 ) ).toBe( 5 );
	} );
} );
