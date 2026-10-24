import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	getMobilePlacementResets,
	getStackedLayouts,
	getUnstackedMobileUpdates,
	isBlockHiddenOnMobile,
	isGridStackedOnMobile,
} from '../mobile-stacking';

describe( 'isGridStackedOnMobile()', () => {
	let originalExperiment: boolean | undefined;
	beforeEach( () => {
		originalExperiment = window.__experimentalEnableGridInteractivity;
		window.__experimentalEnableGridInteractivity = true;
	} );
	afterEach( () => {
		window.__experimentalEnableGridInteractivity = originalExperiment;
	} );

	it( 'does not stack manual placement grids by default', () => {
		expect( isGridStackedOnMobile( { isManualPlacement: true } ) ).toBe(
			false
		);
	} );

	it( 'never stacks auto placement grids', () => {
		expect( isGridStackedOnMobile( { columnCount: 3 } ) ).toBe( false );
	} );

	it( 'respects stackOnMobile in the default state and the mobile layout', () => {
		expect(
			isGridStackedOnMobile( {
				isManualPlacement: true,
				stackOnMobile: true,
			} )
		).toBe( true );
		expect(
			isGridStackedOnMobile(
				{ isManualPlacement: true },
				{ '@mobile': { layout: { stackOnMobile: true } } }
			)
		).toBe( true );
		expect(
			isGridStackedOnMobile(
				{ isManualPlacement: true, stackOnMobile: true },
				{ '@mobile': { layout: { stackOnMobile: false } } }
			)
		).toBe( false );
	} );

	it( 'uses the placement of the mobile layout', () => {
		expect(
			isGridStackedOnMobile(
				{ isManualPlacement: true, stackOnMobile: true },
				{ '@mobile': { layout: { isManualPlacement: null } } }
			)
		).toBe( false );
		expect(
			isGridStackedOnMobile(
				{ columnCount: 3, stackOnMobile: true },
				{ '@mobile': { layout: { isManualPlacement: true } } }
			)
		).toBe( true );
	} );

	it( 'does not stack without the grid interactivity experiment', () => {
		window.__experimentalEnableGridInteractivity = false;
		expect(
			isGridStackedOnMobile( {
				isManualPlacement: true,
				stackOnMobile: true,
			} )
		).toBe( false );
	} );
} );

describe( 'getUnstackedMobileUpdates()', () => {
	const gridAttributes = {
		layout: { type: 'grid', isManualPlacement: true, columnCount: 3 },
		style: { spacing: { blockGap: '1rem' } },
	};
	const children = [
		{
			clientId: 'a',
			attributes: {
				style: { layout: { columnStart: 2, rowStart: 1, rowSpan: 2 } },
			},
		},
		{
			clientId: 'b',
			attributes: {
				style: {
					layout: { columnStart: 1, rowStart: 1, columnSpan: 2 },
					'@mobile': { layout: { columnStart: 3 } },
				},
			},
		},
		{ clientId: 'c', attributes: {} },
	];

	it( 'places each child where the stack showed it', () => {
		const updates = getUnstackedMobileUpdates( {
			gridClientId: 'grid',
			gridAttributes,
			children,
		} );
		expect( updates.a.style[ '@mobile' ].layout ).toEqual( {
			columnStart: 1,
			columnSpan: 3,
			rowStart: 1,
			rowSpan: 2,
		} );
		expect( updates.b.style[ '@mobile' ].layout ).toEqual( {
			columnStart: 1,
			columnSpan: 3,
			rowStart: 3,
			rowSpan: 1,
		} );
		expect( updates.c.style[ '@mobile' ].layout ).toEqual( {
			columnStart: 1,
			columnSpan: 3,
			rowStart: 4,
			rowSpan: 1,
		} );
	} );

	it( 'keeps the default state of each child', () => {
		const updates = getUnstackedMobileUpdates( {
			gridClientId: 'grid',
			gridAttributes,
			children,
		} );
		expect( updates.b.style.layout ).toEqual( {
			columnStart: 1,
			rowStart: 1,
			columnSpan: 2,
		} );
	} );

	it( 'turns stacking off and sizes the grid for mobile', () => {
		const updates = getUnstackedMobileUpdates( {
			gridClientId: 'grid',
			gridAttributes,
			children,
		} );
		expect( updates.grid.style ).toEqual( {
			spacing: { blockGap: '1rem' },
			'@mobile': {
				layout: { stackOnMobile: false, columnCount: 3, rowCount: 4 },
			},
		} );
	} );

	it( 'uses the mobile column count when the grid has one', () => {
		const updates = getUnstackedMobileUpdates( {
			gridClientId: 'grid',
			gridAttributes: {
				...gridAttributes,
				style: { '@mobile': { layout: { columnCount: 2 } } },
			},
			children: [ { clientId: 'a', attributes: {} } ],
		} );
		expect( updates.a.style[ '@mobile' ].layout.columnSpan ).toBe( 2 );
		expect( updates.grid.style[ '@mobile' ].layout.columnCount ).toBe( 2 );
	} );
} );

describe( 'isBlockHiddenOnMobile()', () => {
	it( 'is true for blocks hidden everywhere or on mobile', () => {
		expect(
			isBlockHiddenOnMobile( { metadata: { blockVisibility: false } } )
		).toBe( true );
		expect(
			isBlockHiddenOnMobile( {
				metadata: { blockVisibility: { viewport: { mobile: false } } },
			} )
		).toBe( true );
	} );

	it( 'is false for blocks shown on mobile', () => {
		expect( isBlockHiddenOnMobile( {} ) ).toBe( false );
		expect(
			isBlockHiddenOnMobile( {
				metadata: { blockVisibility: { viewport: { tablet: false } } },
			} )
		).toBe( false );
	} );
} );

describe( 'stacking with blocks hidden on mobile', () => {
	const gridAttributes = {
		layout: { type: 'grid', isManualPlacement: true, columnCount: 2 },
	};
	const children = [
		{ clientId: 'a', attributes: {} },
		{
			clientId: 'hidden',
			attributes: {
				style: { layout: { columnStart: 2, rowStart: 1 } },
				metadata: { blockVisibility: { viewport: { mobile: false } } },
			},
		},
		{ clientId: 'b', attributes: {} },
	];

	it( 'gives hidden blocks no place in the stack', () => {
		const updates = getUnstackedMobileUpdates( {
			gridClientId: 'grid',
			gridAttributes,
			children,
		} );
		expect( updates.hidden ).toBeUndefined();
		expect( updates.b.style[ '@mobile' ].layout.rowStart ).toBe( 2 );
		expect( updates.grid.style[ '@mobile' ].layout.rowCount ).toBe( 2 );
	} );

	it( 'gets the stacked layouts of the blocks and their grid', () => {
		expect( getStackedLayouts( gridAttributes, children ) ).toEqual( {
			grid: { stackOnMobile: false, columnCount: 2, rowCount: 2 },
			children: {
				a: { columnStart: 1, columnSpan: 2, rowStart: 1, rowSpan: 1 },
				b: { columnStart: 1, columnSpan: 2, rowStart: 2, rowSpan: 1 },
			},
		} );
	} );
} );

describe( 'getMobilePlacementResets()', () => {
	it( 'removes mobile placements, keeping other mobile values', () => {
		expect(
			getMobilePlacementResets( [
				{
					clientId: 'placed',
					attributes: {
						style: {
							layout: { columnStart: 2, rowStart: 1 },
							'@mobile': {
								layout: {
									columnStart: 1,
									columnSpan: 2,
									rowStart: 3,
									rowSpan: 1,
									box: {
										left: 0.1,
										top: 0,
										width: 0.5,
										height: 1,
									},
									selfStretch: 'fill',
								},
								color: { text: 'red' },
							},
						},
					},
				},
			] )
		).toEqual( {
			placed: {
				style: {
					layout: { columnStart: 2, rowStart: 1 },
					'@mobile': {
						layout: { selfStretch: 'fill' },
						color: { text: 'red' },
					},
				},
			},
		} );
	} );

	it( 'removes the objects that end up empty', () => {
		expect(
			getMobilePlacementResets( [
				{
					clientId: 'a',
					attributes: {
						style: { '@mobile': { layout: { rowStart: 2 } } },
					},
				},
			] )
		).toEqual( { a: { style: undefined } } );
	} );

	it( 'leaves blocks without a mobile placement out', () => {
		expect(
			getMobilePlacementResets( [
				{ clientId: 'a', attributes: {} },
				{
					clientId: 'b',
					attributes: {
						style: {
							layout: { rowStart: 2 },
							'@mobile': { layout: { selfStretch: 'fit' } },
						},
					},
				},
			] )
		).toEqual( {} );
	} );
} );
