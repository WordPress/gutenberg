import { describe, expect, it } from 'vitest';
import { getMinimumInsertionRect } from '../get-minimum-insertion-rect';
import { GridRect, getGridTracks } from '../utils';

// Six 40px columns and six 40px rows, with 10px gaps: three tracks and their
// two gaps measure 140px, and four measure 190px.
const columnTracks = getGridTracks( '40px 40px 40px 40px 40px 40px', 10 );
const rowTracks = getGridTracks( '40px 40px 40px 40px 40px 40px', 10 );

function toPlain( rect ) {
	return {
		columnStart: rect.columnStart,
		rowStart: rect.rowStart,
		columnSpan: rect.columnSpan,
		rowSpan: rect.rowSpan,
	};
}

function getRect( rect, occupiedRects ) {
	return toPlain(
		getMinimumInsertionRect( {
			rect: new GridRect( rect ),
			columnTracks,
			rowTracks,
			occupiedRects,
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
		expect( getRect( { columnStart: 6, rowStart: 5 } ) ).toEqual( {
			columnStart: 3,
			rowStart: 3,
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

	it( 'grows around cells that other blocks cover', () => {
		// A block covers the column to the right of the cell.
		expect(
			getRect( { columnStart: 3, rowStart: 1 }, [
				new GridRect( {
					columnStart: 4,
					rowStart: 1,
					rowSpan: 6,
				} ),
			] )
		).toEqual( {
			columnStart: 1,
			rowStart: 1,
			columnSpan: 3,
			rowSpan: 4,
		} );
	} );

	it( 'stays smaller than the minimum when no free cells are left', () => {
		expect(
			getRect( { columnStart: 2, rowStart: 2 }, [
				new GridRect( { columnStart: 1, rowStart: 1, columnSpan: 6 } ),
				new GridRect( { columnStart: 1, rowStart: 2 } ),
				new GridRect( { columnStart: 4, rowStart: 2, rowSpan: 5 } ),
				new GridRect( { columnStart: 1, rowStart: 4, columnSpan: 3 } ),
			] )
		).toEqual( {
			columnStart: 2,
			rowStart: 2,
			columnSpan: 2,
			rowSpan: 2,
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
					minimumHeight: 200,
				} )
			)
		).toEqual( {
			columnStart: 1,
			rowStart: 1,
			columnSpan: 2,
			rowSpan: 5,
		} );
	} );

	it( "doesn't add a track for a fraction of a pixel", () => {
		expect(
			toPlain(
				getMinimumInsertionRect( {
					rect: new GridRect( { columnStart: 1, rowStart: 1 } ),
					columnTracks: getGridTracks(
						'41.66px 41.66px 41.66px',
						10
					),
					rowTracks: getGridTracks( '41.66px 41.66px 41.66px', 10 ),
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
		expect( getRect( { columnStart: 7, rowStart: 1 } ) ).toEqual( {
			columnStart: 7,
			rowStart: 1,
			columnSpan: 1,
			rowSpan: 1,
		} );
	} );
} );
