import { describe, expect, it } from 'vitest';
import {
	getGridRowResize,
	getRowDeltaFromDistance,
} from '../get-grid-row-resize';
import { getGridTracks } from '../utils';

const children = [
	{ rowStart: 2, rowSpan: 2 },
	{ rowStart: 3 },
	{ rowStart: undefined },
];

describe( 'getGridRowResize()', () => {
	it( 'adds rows at the bottom', () => {
		expect(
			getGridRowResize( {
				rowCount: 4,
				children,
				edge: 'bottom',
				rowDelta: 2,
			} )
		).toEqual( { rowCount: 6, rowShift: 0 } );
	} );

	it( 'removes empty rows at the bottom, but not rows with blocks', () => {
		expect(
			getGridRowResize( {
				rowCount: 5,
				children,
				edge: 'bottom',
				rowDelta: -4,
			} )
		).toEqual( { rowCount: 3, rowShift: 0 } );
	} );

	it( 'adds rows at the top and moves the blocks down', () => {
		expect(
			getGridRowResize( {
				rowCount: 3,
				children,
				edge: 'top',
				rowDelta: 2,
			} )
		).toEqual( { rowCount: 5, rowShift: 2 } );
	} );

	it( 'removes empty rows at the top and moves the blocks up', () => {
		expect(
			getGridRowResize( {
				rowCount: 4,
				children,
				edge: 'top',
				rowDelta: -3,
			} )
		).toEqual( { rowCount: 3, rowShift: -1 } );
	} );

	it( 'keeps at least one row in an empty grid', () => {
		expect(
			getGridRowResize( {
				rowCount: 3,
				children: [],
				edge: 'top',
				rowDelta: -5,
			} )
		).toEqual( { rowCount: 1, rowShift: -2 } );
		expect(
			getGridRowResize( {
				rowCount: 3,
				children: [],
				edge: 'bottom',
				rowDelta: -5,
			} )
		).toEqual( { rowCount: 1, rowShift: 0 } );
	} );

	it( 'counts rows that blocks are in when the row count is too low', () => {
		expect(
			getGridRowResize( {
				rowCount: 2,
				children,
				edge: 'bottom',
				rowDelta: 1,
			} )
		).toEqual( { rowCount: 4, rowShift: 0 } );
	} );
} );

describe( 'getRowDeltaFromDistance()', () => {
	// Three 50px rows with 10px gaps, so each row takes 60px.
	const rowTracks = getGridTracks( '50px 50px 50px', 10 );

	it( 'rounds the distance to whole rows', () => {
		expect( getRowDeltaFromDistance( rowTracks, 100, 10 ) ).toBe( 2 );
		expect( getRowDeltaFromDistance( rowTracks, 20, 10 ) ).toBe( 0 );
		expect( getRowDeltaFromDistance( rowTracks, -70, 10 ) ).toBe( -1 );
	} );

	it( 'returns 0 without rows', () => {
		expect( getRowDeltaFromDistance( [], 100, 10 ) ).toBe( 0 );
	} );
} );
