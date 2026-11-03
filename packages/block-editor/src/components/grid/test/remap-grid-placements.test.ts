import { describe, expect, it } from 'vitest';
import { getColumnCountChangeUpdates } from '../remap-grid-placements';
import {
	getEqualTracks,
	getPixelRectFromGridPlacement,
	type GridPlacement,
	type PixelRect,
} from '../free-placement';

// A 430px wide grid with 10px gaps: four columns are 100px wide.
const width = 430;
const gap = 10;

function toPixels(
	placement: GridPlacement,
	columnCount: number,
	rowCount: number
): PixelRect | null {
	return getPixelRectFromGridPlacement(
		placement,
		getEqualTracks( { count: columnCount, size: width, gap } ),
		getEqualTracks( {
			count: rowCount,
			size: ( width * rowCount ) / columnCount,
			gap,
		} )
	);
}

function expectSamePixels( actual: PixelRect | null, expected: PixelRect ) {
	expect( actual ).not.toBeNull();
	for ( const edge of [ 'left', 'top', 'right', 'bottom' ] as const ) {
		expect(
			Math.abs( ( actual as PixelRect )[ edge ] - expected[ edge ] )
		).toBeLessThan( 0.5 );
	}
}

describe( 'getColumnCountChangeUpdates', () => {
	const options = {
		width,
		columnGap: gap,
		rowGap: gap,
		columnCount: 4,
		rowCount: 4,
	};

	it( "keeps a snapped block's pixels when adding a column", () => {
		const result = getColumnCountChangeUpdates( {
			...options,
			newColumnCount: 5,
			placements: {
				a: { columnStart: 1, columnSpan: 2, rowStart: 1, rowSpan: 1 },
			},
		} );
		expect( result.rowCount ).toBe( 5 );
		expectSamePixels( toPixels( result.placements.a, 5, 5 ), {
			left: 0,
			top: 0,
			right: 210,
			bottom: 100,
		} );
		expect( result.placements.a.box ).toBeDefined();
	} );

	it( "keeps a free block's box when removing a column", () => {
		const result = getColumnCountChangeUpdates( {
			...options,
			newColumnCount: 3,
			placements: {
				a: {
					columnStart: 1,
					columnSpan: 3,
					rowStart: 1,
					rowSpan: 1,
					box: {
						left: 0.1563,
						top: 0.0625,
						width: 0.6563,
						height: 0.7,
					},
				},
			},
		} );
		expect( result.rowCount ).toBe( 3 );
		expectSamePixels( toPixels( result.placements.a, 3, 3 ), {
			left: 50,
			top: 20,
			right: 260,
			bottom: 90,
		} );
	} );

	it( 'never places past the last column', () => {
		const result = getColumnCountChangeUpdates( {
			...options,
			newColumnCount: 5,
			placements: {
				a: { columnStart: 3, columnSpan: 2, rowStart: 1, rowSpan: 1 },
			},
		} );
		const { columnStart, columnSpan } = result.placements.a;
		expect( columnStart + columnSpan - 1 ).toBeLessThanOrEqual( 5 );
		expectSamePixels( toPixels( result.placements.a, 5, 5 ), {
			left: 220,
			top: 0,
			right: 430,
			bottom: 100,
		} );
	} );

	it( 'adds rows for a block that would fall below the grid', () => {
		// The block is in a fifth row, past the grid's four.
		const result = getColumnCountChangeUpdates( {
			...options,
			newColumnCount: 5,
			placements: {
				a: { columnStart: 1, columnSpan: 1, rowStart: 5, rowSpan: 1 },
			},
		} );
		// Five 78px rows with gaps end at 430, and the block ends at 540.
		expect( result.rowCount ).toBe( 7 );
		expectSamePixels( toPixels( result.placements.a, 5, result.rowCount ), {
			left: 0,
			top: 440,
			right: 100,
			bottom: 540,
		} );
	} );

	it( 'keeps blocks in place in a grid with padding', () => {
		// A border-box grid with 40px of padding all round takes its height
		// from its 510px border box: 4 × 2 cells leave 175px of content,
		// so its rows are 82.5px.
		const padded = {
			...options,
			rowCount: 2,
			aspectWidth: 510,
			heightOffset: 80,
		};
		const result = getColumnCountChangeUpdates( {
			...padded,
			newColumnCount: 5,
			placements: {
				a: { columnStart: 1, columnSpan: 1, rowStart: 2, rowSpan: 1 },
			},
		} );
		expect( result.rowCount ).toBe( 3 );
		// Three rows in 510 × 3 / 5 - 80 = 226px.
		const rect = getPixelRectFromGridPlacement(
			result.placements.a,
			getEqualTracks( { count: 5, size: width, gap } ),
			getEqualTracks( { count: 3, size: 226, gap } )
		);
		expectSamePixels( rect, {
			left: 0,
			top: 92.5,
			right: 100,
			bottom: 175,
		} );
	} );

	it( 'skips blocks without a start', () => {
		const result = getColumnCountChangeUpdates( {
			...options,
			newColumnCount: 5,
			placements: {
				a: { columnSpan: 2 } as GridPlacement,
			},
		} );
		expect( result.placements ).toEqual( {} );
	} );
} );
