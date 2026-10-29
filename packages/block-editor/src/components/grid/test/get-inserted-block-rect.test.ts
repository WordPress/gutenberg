import { describe, expect, it } from 'vitest';
import {
	getInsertedBlockRect,
	getInsertionSize,
} from '../get-inserted-block-rect';
import { GridRect, getGridTracks } from '../utils';

// Eight 40px columns and six 40px rows, with 10px gaps: three tracks and
// their two gaps measure 140px.
const columnTracks = getGridTracks(
	'40px 40px 40px 40px 40px 40px 40px 40px',
	10
);
const rowTracks = getGridTracks( '40px 40px 40px 40px 40px 40px', 10 );

function toPlain( rect: GridRect ) {
	return {
		columnStart: rect.columnStart,
		rowStart: rect.rowStart,
		columnSpan: rect.columnSpan,
		rowSpan: rect.rowSpan,
	};
}

const size = { columnSpan: 3, rowSpan: 2 };

describe( 'getInsertionSize()', () => {
	it( 'is the fewest cells that reach the minimum size', () => {
		expect(
			getInsertionSize( {
				columnTracks,
				rowTracks,
				minimumWidth: 140,
				minimumHeight: 90,
			} )
		).toEqual( { columnSpan: 3, rowSpan: 2 } );
	} );

	it( 'is at most half the grid each way', () => {
		expect(
			getInsertionSize( {
				columnTracks,
				rowTracks,
				minimumWidth: 1000,
				minimumHeight: 1000,
			} )
		).toEqual( { columnSpan: 4, rowSpan: 3 } );
	} );

	it( 'is one cell in a two by two grid', () => {
		expect(
			getInsertionSize( {
				columnTracks: getGridTracks( '200px 200px', 10 ),
				rowTracks: getGridTracks( '200px 200px', 10 ),
			} )
		).toEqual( { columnSpan: 1, rowSpan: 1 } );
	} );

	it( 'is one cell when the grid has not been measured', () => {
		expect( getInsertionSize( {} ) ).toEqual( {
			columnSpan: 1,
			rowSpan: 1,
		} );
	} );
} );

describe( 'getInsertedBlockRect()', () => {
	describe( 'in the middle', () => {
		it( 'centers the block in the grid', () => {
			expect(
				toPlain(
					getInsertedBlockRect( {
						placement: 'center',
						size,
						columnCount: 8,
						rowCount: 6,
						occupiedRects: [],
					} )
				)
			).toEqual( {
				columnStart: 3,
				rowStart: 3,
				columnSpan: 3,
				rowSpan: 2,
			} );
		} );

		it( 'covers other blocks in the middle', () => {
			expect(
				toPlain(
					getInsertedBlockRect( {
						placement: 'center',
						size,
						columnCount: 8,
						rowCount: 6,
						occupiedRects: [
							new GridRect( {
								columnStart: 4,
								rowStart: 3,
								columnSpan: 2,
								rowSpan: 2,
							} ),
						],
					} )
				)
			).toEqual( {
				columnStart: 3,
				rowStart: 3,
				columnSpan: 3,
				rowSpan: 2,
			} );
		} );

		it( 'moves a cell down and right from a block already there', () => {
			const occupiedRects = [
				new GridRect( {
					columnStart: 3,
					rowStart: 3,
					columnSpan: 3,
					rowSpan: 2,
				} ),
				new GridRect( {
					columnStart: 4,
					rowStart: 4,
					columnSpan: 3,
					rowSpan: 2,
				} ),
			];
			expect(
				toPlain(
					getInsertedBlockRect( {
						placement: 'center',
						size,
						columnCount: 8,
						rowCount: 6,
						occupiedRects,
					} )
				)
			).toEqual( {
				columnStart: 5,
				rowStart: 5,
				columnSpan: 3,
				rowSpan: 2,
			} );
		} );

		it( 'stops moving at the edges of the grid', () => {
			const occupiedRects = [ 3, 4, 5 ].map(
				( start ) =>
					new GridRect( {
						columnStart: start,
						rowStart: start,
						columnSpan: 3,
						rowSpan: 2,
					} )
			);
			expect(
				toPlain(
					getInsertedBlockRect( {
						placement: 'center',
						size,
						columnCount: 7,
						rowCount: 6,
						occupiedRects,
					} )
				)
			).toEqual( {
				columnStart: 5,
				rowStart: 5,
				columnSpan: 3,
				rowSpan: 2,
			} );
		} );

		it( 'starts at the top of a grid with fewer rows than the block', () => {
			expect(
				toPlain(
					getInsertedBlockRect( {
						placement: 'center',
						size,
						columnCount: 8,
						rowCount: 1,
						occupiedRects: [],
					} )
				)
			).toEqual( {
				columnStart: 3,
				rowStart: 1,
				columnSpan: 3,
				rowSpan: 2,
			} );
		} );
	} );

	describe( 'after a block', () => {
		const reference = new GridRect( {
			columnStart: 1,
			rowStart: 2,
			columnSpan: 2,
			rowSpan: 3,
		} );

		it( 'goes to its right', () => {
			expect(
				toPlain(
					getInsertedBlockRect( {
						placement: 'after',
						reference,
						size,
						columnCount: 8,
						rowCount: 6,
						occupiedRects: [ reference ],
					} )
				)
			).toEqual( {
				columnStart: 3,
				rowStart: 2,
				columnSpan: 3,
				rowSpan: 2,
			} );
		} );

		it( 'goes below it when its right is taken', () => {
			expect(
				toPlain(
					getInsertedBlockRect( {
						placement: 'after',
						reference,
						size,
						columnCount: 8,
						rowCount: 6,
						occupiedRects: [
							reference,
							new GridRect( { columnStart: 4, rowStart: 3 } ),
						],
					} )
				)
			).toEqual( {
				columnStart: 1,
				rowStart: 5,
				columnSpan: 3,
				rowSpan: 2,
			} );
		} );

		it( 'goes below it when its right is past the grid', () => {
			const rightmost = new GridRect( {
				columnStart: 6,
				rowStart: 1,
				columnSpan: 3,
				rowSpan: 1,
			} );
			expect(
				toPlain(
					getInsertedBlockRect( {
						placement: 'after',
						reference: rightmost,
						size,
						columnCount: 8,
						rowCount: 6,
						occupiedRects: [ rightmost ],
					} )
				)
			).toEqual( {
				columnStart: 6,
				rowStart: 2,
				columnSpan: 3,
				rowSpan: 2,
			} );
		} );

		it( 'goes further down past blocks below it', () => {
			expect(
				toPlain(
					getInsertedBlockRect( {
						placement: 'after',
						reference,
						size,
						columnCount: 4,
						rowCount: 6,
						occupiedRects: [
							reference,
							new GridRect( { columnStart: 2, rowStart: 6 } ),
						],
					} )
				)
			).toEqual( {
				columnStart: 1,
				rowStart: 7,
				columnSpan: 3,
				rowSpan: 2,
			} );
		} );
	} );

	describe( 'before a block', () => {
		const reference = new GridRect( {
			columnStart: 5,
			rowStart: 4,
			columnSpan: 2,
			rowSpan: 2,
		} );

		it( 'goes to its left', () => {
			expect(
				toPlain(
					getInsertedBlockRect( {
						placement: 'before',
						reference,
						size,
						columnCount: 8,
						rowCount: 6,
						occupiedRects: [ reference ],
					} )
				)
			).toEqual( {
				columnStart: 2,
				rowStart: 4,
				columnSpan: 3,
				rowSpan: 2,
			} );
		} );

		it( 'goes above it when its left is taken', () => {
			expect(
				toPlain(
					getInsertedBlockRect( {
						placement: 'before',
						reference,
						size,
						columnCount: 8,
						rowCount: 6,
						occupiedRects: [
							reference,
							new GridRect( { columnStart: 3, rowStart: 5 } ),
						],
					} )
				)
			).toEqual( {
				columnStart: 5,
				rowStart: 2,
				columnSpan: 3,
				rowSpan: 2,
			} );
		} );

		it( 'goes after it when there is no room before it', () => {
			const topLeft = new GridRect( {
				columnStart: 1,
				rowStart: 1,
				columnSpan: 2,
				rowSpan: 1,
			} );
			expect(
				toPlain(
					getInsertedBlockRect( {
						placement: 'before',
						reference: topLeft,
						size,
						columnCount: 8,
						rowCount: 6,
						occupiedRects: [ topLeft ],
					} )
				)
			).toEqual( {
				columnStart: 3,
				rowStart: 1,
				columnSpan: 3,
				rowSpan: 2,
			} );
		} );
	} );

	describe( 'in the first free place', () => {
		it( 'goes in the first free place in reading order', () => {
			expect(
				toPlain(
					getInsertedBlockRect( {
						placement: 'first-free',
						size,
						columnCount: 8,
						rowCount: 6,
						occupiedRects: [
							new GridRect( { columnStart: 2, rowStart: 1 } ),
							new GridRect( { columnStart: 8, rowStart: 2 } ),
						],
					} )
				)
			).toEqual( {
				columnStart: 3,
				rowStart: 1,
				columnSpan: 3,
				rowSpan: 2,
			} );
		} );

		it( 'stays inside the columns', () => {
			expect(
				toPlain(
					getInsertedBlockRect( {
						placement: 'first-free',
						size,
						columnCount: 4,
						rowCount: 6,
						occupiedRects: [
							new GridRect( { columnStart: 1, rowStart: 1 } ),
						],
					} )
				)
			).toEqual( {
				columnStart: 2,
				rowStart: 1,
				columnSpan: 3,
				rowSpan: 2,
			} );
		} );
	} );
} );
