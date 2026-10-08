import { describe, expect, it } from 'vitest';
import {
	getGridDropTarget,
	getPixelRectFromGridRect,
	getTrackIndexAtPosition,
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

describe( 'getTrackIndexAtPosition()', () => {
	it( 'finds the track containing a position', () => {
		expect( getTrackIndexAtPosition( columnTracks, 150 ) ).toBe( 1 );
	} );

	it( 'gives a position in a gap to the track before the gap', () => {
		expect( getTrackIndexAtPosition( columnTracks, 105 ) ).toBe( 0 );
	} );

	it( 'gives positions outside the grid to the first and last track', () => {
		expect( getTrackIndexAtPosition( columnTracks, -20 ) ).toBe( 0 );
		expect( getTrackIndexAtPosition( columnTracks, 900 ) ).toBe( 2 );
	} );
} );

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

	it( 'keeps the grabbed cell under the pointer', () => {
		// A 2x2 block grabbed by its bottom-right cell, pointer over cell 3/3.
		expect(
			toPlain(
				getGridDropTarget( {
					x: 230,
					y: 130,
					columnTracks,
					rowTracks,
					columnSpan: 2,
					rowSpan: 2,
					grabOffset: { column: 1, row: 1 },
				} )
			)
		).toEqual( { columnStart: 2, rowStart: 2, columnSpan: 2, rowSpan: 2 } );
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
					grabOffset: { column: 1, row: 1 },
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
				x: 245,
				y: 10,
				columnTracks: unevenColumns,
				rowTracks,
			} ).columnStart
		).toBe( 2 );
		expect(
			getGridDropTarget( {
				x: 265,
				y: 10,
				columnTracks: unevenColumns,
				rowTracks,
			} ).columnStart
		).toBe( 3 );
	} );
} );

describe( 'getPixelRectFromGridRect()', () => {
	it( 'converts cells to pixels, excluding the trailing gap', () => {
		expect(
			getPixelRectFromGridRect(
				getGridDropTarget( {
					x: 120,
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
