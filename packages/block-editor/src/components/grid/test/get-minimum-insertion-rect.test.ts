import { describe, expect, it } from 'vitest';
import { getMinimumInsertionRect } from '../get-minimum-insertion-rect';
import { GridRect, getGridTracks } from '../utils';

// Eight 40px columns and eight 40px rows, with 10px gaps: three tracks and
// their two gaps measure 140px, and four measure 190px.
const tracks = getGridTracks( '40px 40px 40px 40px 40px 40px 40px 40px', 10 );
const columnTracks = tracks;
const rowTracks = tracks;

/** The cells to start from, as passed to `GridRect`. */
interface RectInput {
	columnStart: number;
	rowStart: number;
	columnSpan?: number;
	rowSpan?: number;
}

function toPlain( rect: GridRect ) {
	return {
		columnStart: rect.columnStart,
		rowStart: rect.rowStart,
		columnSpan: rect.columnSpan,
		rowSpan: rect.rowSpan,
	};
}

function getRect( rect: RectInput ) {
	return toPlain(
		getMinimumInsertionRect( {
			rect: new GridRect( rect ),
			columnTracks,
			rowTracks,
			minimumWidth: 160,
			minimumHeight: 160,
		} )
	);
}

describe( 'getMinimumInsertionRect()', () => {
	it( 'grows a cell to the right and down until it is big enough', () => {
		expect( getRect( { columnStart: 2, rowStart: 2 } ) ).toEqual( {
			columnStart: 2,
			rowStart: 2,
			columnSpan: 4,
			rowSpan: 4,
		} );
	} );

	it( 'grows to the left and up at the edges of the grid', () => {
		expect( getRect( { columnStart: 8, rowStart: 7 } ) ).toEqual( {
			columnStart: 5,
			rowStart: 5,
			columnSpan: 4,
			rowSpan: 4,
		} );
	} );

	it( 'leaves cells that are already big enough as they are', () => {
		expect(
			getRect( {
				columnStart: 1,
				rowStart: 1,
				columnSpan: 5,
				rowSpan: 4,
			} )
		).toEqual( {
			columnStart: 1,
			rowStart: 1,
			columnSpan: 5,
			rowSpan: 4,
		} );
	} );

	it( 'only grows the axis that is too small', () => {
		expect(
			getRect( {
				columnStart: 1,
				rowStart: 1,
				columnSpan: 6,
				rowSpan: 1,
			} )
		).toEqual( {
			columnStart: 1,
			rowStart: 1,
			columnSpan: 6,
			rowSpan: 4,
		} );
	} );

	it( 'never grows past half of the grid', () => {
		expect(
			toPlain(
				getMinimumInsertionRect( {
					rect: new GridRect( { columnStart: 2, rowStart: 1 } ),
					columnTracks: getGridTracks( '40px 40px 40px 40px', 10 ),
					rowTracks: getGridTracks( '40px 40px 40px 40px 40px', 10 ),
					minimumWidth: 160,
					minimumHeight: 160,
				} )
			)
		).toEqual( {
			columnStart: 2,
			rowStart: 1,
			columnSpan: 2,
			rowSpan: 2,
		} );
	} );

	it( 'stays one cell in a two by two grid', () => {
		expect(
			toPlain(
				getMinimumInsertionRect( {
					rect: new GridRect( { columnStart: 2, rowStart: 1 } ),
					columnTracks: getGridTracks( '40px 40px', 10 ),
					rowTracks: getGridTracks( '40px 40px', 10 ),
					minimumWidth: 160,
					minimumHeight: 160,
				} )
			)
		).toEqual( {
			columnStart: 2,
			rowStart: 1,
			columnSpan: 1,
			rowSpan: 1,
		} );
	} );

	it( 'grows each axis to its own minimum', () => {
		expect(
			toPlain(
				getMinimumInsertionRect( {
					rect: new GridRect( { columnStart: 1, rowStart: 1 } ),
					columnTracks,
					rowTracks,
					minimumWidth: 90,
					minimumHeight: 190,
				} )
			)
		).toEqual( {
			columnStart: 1,
			rowStart: 1,
			columnSpan: 2,
			rowSpan: 4,
		} );
	} );

	it( "doesn't add a track for a fraction of a pixel", () => {
		expect(
			toPlain(
				getMinimumInsertionRect( {
					rect: new GridRect( { columnStart: 1, rowStart: 1 } ),
					columnTracks: getGridTracks(
						'41.66px 41.66px 41.66px 41.66px 41.66px 41.66px',
						10
					),
					rowTracks: getGridTracks(
						'41.66px 41.66px 41.66px 41.66px 41.66px 41.66px',
						10
					),
					minimumWidth: 145,
					minimumHeight: 145,
				} )
			)
		).toEqual( {
			columnStart: 1,
			rowStart: 1,
			columnSpan: 3,
			rowSpan: 3,
		} );
	} );

	it( "doesn't change cells outside the grid's tracks", () => {
		expect( getRect( { columnStart: 9, rowStart: 1 } ) ).toEqual( {
			columnStart: 9,
			rowStart: 1,
			columnSpan: 1,
			rowSpan: 1,
		} );
	} );
} );
