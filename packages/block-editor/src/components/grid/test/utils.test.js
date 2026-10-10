import { describe, expect, it } from 'vitest';
import {
	GridRect,
	getBoundingGridRect,
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

// Three 50px rows with 10px gaps: 0-50, 60-110, 120-170.
const rowTracks = getGridTracks( '50px 50px 50px', 10 );

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
