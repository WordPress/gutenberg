import { describe, expect, it } from 'vitest';
import { GridRect } from '../utils';
import { getInsertedChildLayoutStyle } from '../get-inserted-child-layout-style';

const defaultState = { viewport: 'default', pseudo: 'default' };
const tabletState = { viewport: '@tablet', pseudo: 'default' };
const gridLayout = { type: 'grid', columnCount: 4, rowCount: 3 };

describe( 'getInsertedChildLayoutStyle()', () => {
	it( 'places the block in the default state', () => {
		expect(
			getInsertedChildLayoutStyle(
				undefined,
				new GridRect( {
					columnStart: 2,
					rowStart: 1,
					columnSpan: 2,
					rowSpan: 3,
				} ),
				defaultState,
				gridLayout
			)
		).toEqual( {
			layout: {
				columnStart: 2,
				rowStart: 1,
				columnSpan: 2,
				rowSpan: 3,
			},
		} );
	} );

	it( 'leaves out spans of one cell', () => {
		expect(
			getInsertedChildLayoutStyle(
				undefined,
				new GridRect( { columnStart: 3, rowStart: 2 } ),
				defaultState,
				gridLayout
			)
		).toEqual( { layout: { columnStart: 3, rowStart: 2 } } );
	} );

	it( 'removes spans the block already had when it covers one cell', () => {
		expect(
			getInsertedChildLayoutStyle(
				{ layout: { columnSpan: 2, rowSpan: 2, selfStretch: 'fit' } },
				new GridRect( { columnStart: 1, rowStart: 1 } ),
				defaultState,
				gridLayout
			)
		).toEqual( {
			layout: { columnStart: 1, rowStart: 1, selfStretch: 'fit' },
		} );
	} );

	it( 'keeps the rest of the inserted block’s style', () => {
		expect(
			getInsertedChildLayoutStyle(
				{
					color: { background: '#000' },
					spacing: { padding: '1em' },
				},
				new GridRect( { columnStart: 1, rowStart: 2, columnSpan: 2 } ),
				defaultState,
				gridLayout
			)
		).toEqual( {
			color: { background: '#000' },
			spacing: { padding: '1em' },
			layout: { columnStart: 1, rowStart: 2, columnSpan: 2 },
		} );
	} );

	it( 'places the block in the default state and the selected viewport', () => {
		expect(
			getInsertedChildLayoutStyle(
				undefined,
				new GridRect( {
					columnStart: 2,
					rowStart: 2,
					columnSpan: 2,
					rowSpan: 2,
				} ),
				tabletState,
				gridLayout
			)
		).toEqual( {
			layout: {
				columnStart: 2,
				rowStart: 2,
				columnSpan: 2,
				rowSpan: 2,
			},
			'@tablet': {
				layout: {
					columnStart: 2,
					rowStart: 2,
					columnSpan: 2,
					rowSpan: 2,
				},
			},
		} );
	} );

	it( 'fits the default placement to the grid’s own columns and rows', () => {
		// Drawn in a tablet grid with more columns and rows than the
		// default grid has.
		expect(
			getInsertedChildLayoutStyle(
				undefined,
				new GridRect( {
					columnStart: 4,
					rowStart: 3,
					columnSpan: 3,
					rowSpan: 2,
				} ),
				tabletState,
				{ type: 'grid', columnCount: 2, rowCount: 3 }
			)
		).toEqual( {
			layout: {
				columnStart: 1,
				rowStart: 2,
				columnSpan: 2,
				rowSpan: 2,
			},
			'@tablet': {
				layout: {
					columnStart: 4,
					rowStart: 3,
					columnSpan: 3,
					rowSpan: 2,
				},
			},
		} );
	} );

	it( 'removes the block’s placement in other viewports', () => {
		expect(
			getInsertedChildLayoutStyle(
				{
					layout: { columnStart: 3, rowStart: 3 },
					'@tablet': {
						layout: { columnStart: 1, rowStart: 1, columnSpan: 4 },
						color: { text: '#fff' },
					},
					'@mobile': {
						layout: {
							columnStart: 2,
							rowSpan: 2,
							selfStretch: 'fill',
						},
					},
				},
				new GridRect( { columnStart: 2, rowStart: 1, columnSpan: 2 } ),
				defaultState,
				gridLayout
			)
		).toEqual( {
			layout: { columnStart: 2, rowStart: 1, columnSpan: 2 },
			'@tablet': { color: { text: '#fff' } },
			'@mobile': { layout: { selfStretch: 'fill' } },
		} );
	} );

	it( 'replaces the block’s placement in the selected viewport', () => {
		expect(
			getInsertedChildLayoutStyle(
				{
					'@tablet': {
						layout: { columnStart: 1, rowStart: 1, rowSpan: 3 },
					},
				},
				new GridRect( { columnStart: 3, rowStart: 2 } ),
				tabletState,
				gridLayout
			)
		).toEqual( {
			layout: { columnStart: 3, rowStart: 2 },
			'@tablet': { layout: { columnStart: 3, rowStart: 2 } },
		} );
	} );
} );
