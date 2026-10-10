import { describe, expect, it } from 'vitest';
import {
	getGridGrowthUpdate,
	getGridRowResizeUpdates,
} from '../get-grid-row-updates';

const DEFAULT_STATE = { viewport: 'default', pseudo: 'default' };
const TABLET_STATE = { viewport: '@tablet', pseudo: 'default' };

describe( 'getGridGrowthUpdate()', () => {
	const gridAttributes = {
		layout: { type: 'grid', isManualPlacement: true, rowCount: 3 },
		style: { '@tablet': { layout: { rowCount: 4 } } },
	};

	it( 'grows the default row count when a block ends past the last row', () => {
		expect(
			getGridGrowthUpdate( {
				gridAttributes,
				childStyle: { layout: { rowStart: 2, rowSpan: 3 } },
				selectedState: DEFAULT_STATE,
			} )
		).toEqual( {
			layout: { type: 'grid', isManualPlacement: true, rowCount: 4 },
		} );
	} );

	it( 'grows the viewport row count from the viewport placement', () => {
		expect(
			getGridGrowthUpdate( {
				gridAttributes,
				childStyle: {
					layout: { rowStart: 1, rowSpan: 1 },
					'@tablet': { layout: { rowStart: 3, rowSpan: 4 } },
				},
				selectedState: TABLET_STATE,
			} )
		).toEqual( {
			style: { '@tablet': { layout: { rowCount: 6 } } },
		} );
	} );

	it( 'does nothing when the block fits', () => {
		expect(
			getGridGrowthUpdate( {
				gridAttributes,
				childStyle: {
					layout: { rowStart: 3, rowSpan: 2 },
					'@tablet': { layout: { rowStart: 1 } },
				},
				selectedState: TABLET_STATE,
			} )
		).toBeUndefined();
		expect(
			getGridGrowthUpdate( {
				gridAttributes,
				childStyle: { layout: { columnSpan: 2 } },
				selectedState: DEFAULT_STATE,
			} )
		).toBeUndefined();
	} );
} );

describe( 'getGridRowResizeUpdates()', () => {
	const gridAttributes = {
		layout: { type: 'grid', isManualPlacement: true, rowCount: 3 },
	};
	const children = [
		{ clientId: 'a', style: { layout: { rowStart: 1, columnStart: 1 } } },
		{
			clientId: 'b',
			style: {
				layout: { rowStart: 2, columnStart: 2 },
				'@tablet': { layout: { rowStart: 3 } },
			},
		},
		{ clientId: 'c', style: undefined },
	];

	it( 'sets the row count in the default state', () => {
		expect(
			getGridRowResizeUpdates( {
				gridClientId: 'grid',
				gridAttributes,
				children,
				edge: 'bottom',
				rowDelta: 2,
				selectedState: DEFAULT_STATE,
			} )
		).toEqual( {
			rowCount: 5,
			updates: {
				grid: {
					layout: {
						type: 'grid',
						isManualPlacement: true,
						rowCount: 5,
					},
				},
			},
		} );
	} );

	it( 'moves blocks in the default state when rows are added at the top', () => {
		const { updates } = getGridRowResizeUpdates( {
			gridClientId: 'grid',
			gridAttributes,
			children,
			edge: 'top',
			rowDelta: 1,
			selectedState: DEFAULT_STATE,
		} );
		expect( updates.grid.layout.rowCount ).toBe( 4 );
		expect( updates.a.style.layout ).toEqual( {
			rowStart: 2,
			columnStart: 1,
		} );
		expect( updates.b.style ).toEqual( {
			layout: { rowStart: 3, columnStart: 2 },
			'@tablet': { layout: { rowStart: 3 } },
		} );
		expect( updates ).not.toHaveProperty( 'c' );
	} );

	it( 'writes the row count and moved blocks as viewport overrides', () => {
		expect(
			getGridRowResizeUpdates( {
				gridClientId: 'grid',
				gridAttributes,
				children,
				edge: 'top',
				rowDelta: 2,
				selectedState: TABLET_STATE,
			} )
		).toEqual( {
			rowCount: 5,
			updates: {
				grid: { style: { '@tablet': { layout: { rowCount: 5 } } } },
				a: {
					style: {
						layout: { rowStart: 1, columnStart: 1 },
						'@tablet': { layout: { rowStart: 3 } },
					},
				},
				b: {
					style: {
						layout: { rowStart: 2, columnStart: 2 },
						'@tablet': { layout: { rowStart: 5 } },
					},
				},
			},
		} );
	} );

	it( 'returns no updates when nothing changes', () => {
		// Row 3 has a block in it on tablet, so it can't be removed.
		expect(
			getGridRowResizeUpdates( {
				gridClientId: 'grid',
				gridAttributes,
				children,
				edge: 'bottom',
				rowDelta: -1,
				selectedState: TABLET_STATE,
			} )
		).toEqual( { rowCount: 3, updates: null } );
		// Row 1 has a block in it, so no rows can be removed from the top.
		expect(
			getGridRowResizeUpdates( {
				gridClientId: 'grid',
				gridAttributes,
				children,
				edge: 'top',
				rowDelta: -1,
				selectedState: DEFAULT_STATE,
			} )
		).toEqual( { rowCount: 3, updates: null } );
	} );
} );
