import { describe, expect, it } from 'vitest';
import { getManualGridDropRects } from '../manual-grid-drop';
import { GridRect } from '../utils';

describe( 'manual grid selection drops', () => {
	it( 'keeps the relative positions and spans of selected grid items', () => {
		const items = [
			{
				spans: { columnSpan: 2, rowSpan: 1 },
				layout: { columnStart: 2, rowStart: 2 },
			},
			{
				spans: { columnSpan: 1, rowSpan: 2 },
				layout: { columnStart: 5, rowStart: 4 },
			},
		];

		expect( getManualGridDropRects( items, 1, 3, 6, true ) ).toEqual( [
			new GridRect( {
				columnStart: 1,
				rowStart: 3,
				columnSpan: 2,
				rowSpan: 1,
			} ),
			new GridRect( {
				columnStart: 4,
				rowStart: 5,
				columnSpan: 1,
				rowSpan: 2,
			} ),
		] );
	} );

	it( 'wraps incoming blocks in selection order without overlap', () => {
		const items = [
			{ columnSpan: 2, rowSpan: 2 },
			{ columnSpan: 2, rowSpan: 1 },
			{ columnSpan: 1, rowSpan: 3 },
		].map( ( spans ) => ( { spans, layout: {} } ) );

		expect( getManualGridDropRects( items, 3, 1, 4, false ) ).toEqual( [
			new GridRect( {
				columnStart: 3,
				rowStart: 1,
				columnSpan: 2,
				rowSpan: 2,
			} ),
			new GridRect( {
				columnStart: 1,
				rowStart: 3,
				columnSpan: 2,
				rowSpan: 1,
			} ),
			new GridRect( {
				columnStart: 3,
				rowStart: 3,
				columnSpan: 1,
				rowSpan: 3,
			} ),
		] );
	} );

	it( 'keeps the selection within the columns while allowing extra rows', () => {
		const items = [
			{
				spans: { columnSpan: 2, rowSpan: 2 },
				layout: { columnStart: 1, rowStart: 1 },
			},
			{
				spans: { columnSpan: 2, rowSpan: 2 },
				layout: { columnStart: 4, rowStart: 2 },
			},
		];

		expect( getManualGridDropRects( items, 6, 3, 6, true ) ).toEqual( [
			new GridRect( {
				columnStart: 2,
				rowStart: 3,
				columnSpan: 2,
				rowSpan: 2,
			} ),
			new GridRect( {
				columnStart: 5,
				rowStart: 4,
				columnSpan: 2,
				rowSpan: 2,
			} ),
		] );
	} );
} );
