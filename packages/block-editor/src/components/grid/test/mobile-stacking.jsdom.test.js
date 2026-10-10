import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	getUnstackedMobileUpdates,
	isGridStackedOnMobile,
} from '../mobile-stacking';

describe( 'isGridStackedOnMobile()', () => {
	let originalExperiment;
	beforeEach( () => {
		originalExperiment = window.__experimentalEnableGridInteractivity;
		window.__experimentalEnableGridInteractivity = true;
	} );
	afterEach( () => {
		window.__experimentalEnableGridInteractivity = originalExperiment;
	} );

	it( 'stacks manual placement grids by default', () => {
		expect( isGridStackedOnMobile( { isManualPlacement: true } ) ).toBe(
			true
		);
	} );

	it( 'never stacks auto placement grids', () => {
		expect( isGridStackedOnMobile( { columnCount: 3 } ) ).toBe( false );
	} );

	it( 'respects stackOnMobile in the default state and the mobile layout', () => {
		expect(
			isGridStackedOnMobile( {
				isManualPlacement: true,
				stackOnMobile: false,
			} )
		).toBe( false );
		expect(
			isGridStackedOnMobile(
				{ isManualPlacement: true },
				{ '@mobile': { layout: { stackOnMobile: false } } }
			)
		).toBe( false );
	} );

	it( 'does not stack without the grid interactivity experiment', () => {
		window.__experimentalEnableGridInteractivity = false;
		expect( isGridStackedOnMobile( { isManualPlacement: true } ) ).toBe(
			false
		);
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
