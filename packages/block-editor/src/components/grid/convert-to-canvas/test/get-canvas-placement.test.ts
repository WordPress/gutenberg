import { describe, expect, it } from 'vitest';
import {
	chooseColumnCount,
	getTrackHeight,
	placeRows,
	placeTabletRows,
	resolveColumns,
} from '../get-canvas-placement';
import type { HorizontalStep } from '../types';

function columnsOf( steps: HorizontalStep[], columnCount = 12 ) {
	const { columnStart, columnEnd } = resolveColumns(
		steps,
		columnCount,
		100
	);
	return [ columnStart, columnEnd ];
}

describe( 'resolveColumns', () => {
	it( 'splits columns exactly', () => {
		expect(
			columnsOf( [ { type: 'split', start: 0, end: 0.5 } ] )
		).toEqual( [ 1, 6 ] );
		expect(
			columnsOf( [ { type: 'split', start: 0.5, end: 1 } ] )
		).toEqual( [ 7, 12 ] );
		expect(
			columnsOf( [ { type: 'split', start: 1 / 3, end: 2 / 3 } ] )
		).toEqual( [ 5, 8 ] );
	} );

	it( 'keeps centered spans centered', () => {
		expect( columnsOf( [ { type: 'center', size: 0.5 } ] ) ).toEqual( [
			4, 9,
		] );
		// 4.8 columns rounds to 5, which can't be centered in 12, so it
		// takes the closer of 4 and 6.
		expect( columnsOf( [ { type: 'center', size: 0.4 } ] ) ).toEqual( [
			5, 8,
		] );
	} );

	it( 'puts justified spans against an edge', () => {
		expect( columnsOf( [ { type: 'start', size: 0.25 } ] ) ).toEqual( [
			1, 3,
		] );
		expect( columnsOf( [ { type: 'end', size: 0.25 } ] ) ).toEqual( [
			10, 12,
		] );
	} );

	it( 'snaps measured edges to the nearest lines', () => {
		expect(
			columnsOf( [ { type: 'measured', start: 0.26, end: 0.74 } ] )
		).toEqual( [ 4, 9 ] );
		// Never outside the grid, and at least one column.
		expect(
			columnsOf( [ { type: 'measured', start: -0.1, end: 0.01 } ] )
		).toEqual( [ 1, 1 ] );
	} );

	it( 'splits the columns a previous step left', () => {
		const wide: HorizontalStep = { type: 'center', size: 10 / 12 };
		expect(
			columnsOf( [ wide, { type: 'split', start: 0, end: 0.5 } ] )
		).toEqual( [ 2, 6 ] );
		expect(
			columnsOf( [ wide, { type: 'split', start: 0.5, end: 1 } ] )
		).toEqual( [ 7, 11 ] );
	} );

	it( 'reports how far edges moved', () => {
		expect(
			resolveColumns( [ { type: 'center', size: 0.875 } ], 12, 100 ).error
		).toBeCloseTo( 50 );
		expect(
			resolveColumns( [ { type: 'center', size: 0.875 } ], 16, 75 ).error
		).toBeCloseTo( 0 );
	} );
} );

describe( 'chooseColumnCount', () => {
	const geometry = { width: 1180, gap: 20 };

	it( 'prefers 12 columns', () => {
		expect(
			chooseColumnCount(
				[ [ { type: 'split', start: 0, end: 0.5 } ] ],
				geometry
			)
		).toBe( 12 );
	} );

	it( 'chooses the count that puts wide edges on lines', () => {
		// A wide frame of 7/8 of the canvas is 14 of 16 columns, and falls
		// half a column off the lines of 12.
		const wide: HorizontalStep = { type: 'center', size: 0.875 };
		expect(
			chooseColumnCount(
				[
					[ wide, { type: 'split', start: 0, end: 0.5 } ],
					[ wide, { type: 'split', start: 0.5, end: 1 } ],
				],
				geometry
			)
		).toBe( 16 );
	} );
} );

describe( 'getTrackHeight', () => {
	it( 'takes the row height from the width of the border box', () => {
		// The border box is 600px tall, the content box 500px, and five
		// gaps leave 400px for six rows.
		expect(
			getTrackHeight( 6, {
				columnCount: 12,
				width: 1100,
				borderWidth: 1200,
				blockInset: 100,
				isBorderBox: true,
				rowGap: 20,
			} )
		).toBeCloseTo( 400 / 6 );
	} );

	it( 'takes the row height from the width of the content box', () => {
		expect(
			getTrackHeight( 6, {
				columnCount: 12,
				width: 1200,
				borderWidth: 1300,
				blockInset: 100,
				isBorderBox: false,
				rowGap: 0,
			} )
		).toBeCloseTo( 100 );
	} );
} );

// Rows of 80px with 20px gaps, whatever the row count.
const fixedRows = { trackHeight: () => 80, rowGap: 20 };

describe( 'placeRows', () => {
	it( 'starts at the nearest line and ends below the content', () => {
		const { rows, rowCount } = placeRows(
			[
				{
					left: 0,
					right: 580,
					top: 0,
					bottom: 180,
					columnStart: 1,
					columnEnd: 6,
				},
				{
					left: 600,
					right: 1180,
					top: 0,
					bottom: 80,
					columnStart: 7,
					columnEnd: 12,
				},
				{
					left: 0,
					right: 580,
					top: 190,
					bottom: 260,
					columnStart: 1,
					columnEnd: 6,
				},
			],
			fixedRows
		);
		expect( rows ).toEqual( [
			{ rowStart: 1, rowSpan: 2 },
			{ rowStart: 1, rowSpan: 1 },
			{ rowStart: 3, rowSpan: 1 },
		] );
		expect( rowCount ).toBe( 3 );
	} );

	it( 'moves down blocks that did not overlap before', () => {
		const { rows } = placeRows(
			[
				{
					left: 0,
					right: 580,
					top: 0,
					bottom: 140,
					columnStart: 1,
					columnEnd: 6,
				},
				{
					left: 0,
					right: 580,
					top: 145,
					bottom: 200,
					columnStart: 1,
					columnEnd: 6,
				},
			],
			fixedRows
		);
		expect( rows[ 1 ] ).toEqual( { rowStart: 3, rowSpan: 2 } );
	} );

	it( 'keeps blocks that overlapped before overlapping', () => {
		const { rows } = placeRows(
			[
				{
					left: 0,
					right: 580,
					top: 0,
					bottom: 140,
					columnStart: 1,
					columnEnd: 6,
				},
				{
					left: 300,
					right: 880,
					top: 100,
					bottom: 240,
					columnStart: 4,
					columnEnd: 9,
				},
			],
			fixedRows
		);
		expect( rows ).toEqual( [
			{ rowStart: 1, rowSpan: 2 },
			{ rowStart: 2, rowSpan: 2 },
		] );
	} );

	it( 'finds a row count whose rows hold every block', () => {
		const geometry = {
			columnCount: 12,
			width: 1200,
			borderWidth: 1200,
			blockInset: 0,
			isBorderBox: true,
			rowGap: 0,
		};
		const { rows, rowCount } = placeRows(
			[
				{
					left: 0,
					right: 1200,
					top: 0,
					bottom: 450,
					columnStart: 1,
					columnEnd: 12,
				},
			],
			{
				trackHeight: ( count ) => getTrackHeight( count, geometry ),
				rowGap: 0,
			}
		);
		// Rows are 100px tall.
		expect( rows ).toEqual( [ { rowStart: 1, rowSpan: 5 } ] );
		expect( rowCount ).toBe( 5 );
	} );
} );

describe( 'placeTabletRows', () => {
	it( 'grows text and moves down what is below it', () => {
		const { rows, rowCount } = placeTabletRows(
			[
				// Text that needs four rows.
				{
					columnStart: 1,
					columnEnd: 6,
					rowStart: 1,
					rowSpan: 2,
					height: 300,
				},
				// An image, which keeps its rows.
				{ columnStart: 7, columnEnd: 12, rowStart: 1, rowSpan: 2 },
				{ columnStart: 1, columnEnd: 12, rowStart: 3, rowSpan: 1 },
			],
			{ ...fixedRows, rowCount: 3 }
		);
		expect( rows ).toEqual( [
			{ rowStart: 1, rowSpan: 4 },
			{ rowStart: 1, rowSpan: 2 },
			{ rowStart: 5, rowSpan: 1 },
		] );
		expect( rowCount ).toBe( 5 );
	} );

	it( 'keeps rows that are tall enough', () => {
		const items = [
			{
				columnStart: 1,
				columnEnd: 6,
				rowStart: 1,
				rowSpan: 2,
				height: 150,
			},
			{ columnStart: 7, columnEnd: 12, rowStart: 2, rowSpan: 1 },
		];
		expect(
			placeTabletRows( items, { ...fixedRows, rowCount: 2 } )
		).toEqual( {
			rows: [
				{ rowStart: 1, rowSpan: 2 },
				{ rowStart: 2, rowSpan: 1 },
			],
			rowCount: 2,
		} );
	} );
} );
