import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getGridChildUpdates } from '../use-update-grid-child-layout';

const DEFAULT_STATE = { viewport: 'default', pseudo: 'default' };
const MOBILE_STATE = { viewport: '@mobile', pseudo: 'default' };
const TABLET_STATE = { viewport: '@tablet', pseudo: 'default' };

describe( 'getGridChildUpdates()', () => {
	let originalExperiment;
	beforeEach( () => {
		originalExperiment = window.__experimentalEnableGridInteractivity;
		window.__experimentalEnableGridInteractivity = true;
	} );
	afterEach( () => {
		window.__experimentalEnableGridInteractivity = originalExperiment;
	} );

	const manualGrid = {
		layout: {
			type: 'grid',
			isManualPlacement: true,
			columnCount: 3,
			rowCount: 2,
		},
	};
	const children = [
		{
			clientId: 'a',
			attributes: {
				style: { layout: { columnStart: 1, rowStart: 1, rowSpan: 2 } },
			},
		},
		{
			clientId: 'b',
			attributes: { style: { layout: { columnStart: 2, rowStart: 1 } } },
		},
	];

	function getUpdates( options ) {
		return getGridChildUpdates( {
			clientId: 'b',
			style: children[ 1 ].attributes.style,
			gridClientId: 'grid',
			gridAttributes: manualGrid,
			children,
			...options,
		} );
	}

	it( 'merges layout changes into the selected state', () => {
		expect(
			getUpdates( {
				change: { columnStart: 3 },
				selectedState: DEFAULT_STATE,
			} )
		).toEqual( {
			b: { style: { layout: { columnStart: 3, rowStart: 1 } } },
		} );
	} );

	it( 'grows the grid in the default state when a block ends past the last row', () => {
		expect(
			getUpdates( {
				change: { rowSpan: 3 },
				selectedState: DEFAULT_STATE,
			} ).grid
		).toEqual( { layout: { ...manualGrid.layout, rowCount: 3 } } );
	} );

	it( 'grows the grid in a viewport state', () => {
		expect(
			getUpdates( {
				change: { rowStart: 4 },
				selectedState: TABLET_STATE,
			} ).grid
		).toEqual( { style: { '@tablet': { layout: { rowCount: 4 } } } } );
	} );

	it( 'does not grow auto placement grids', () => {
		expect(
			getUpdates( {
				change: { rowStart: 4 },
				selectedState: DEFAULT_STATE,
				gridAttributes: { layout: { type: 'grid', rowCount: 2 } },
			} ).grid
		).toBeUndefined();
	} );

	it( 'unstacks a grid stacked on mobile before applying the change', () => {
		const updates = getUpdates( {
			change: { columnSpan: 2 },
			selectedState: MOBILE_STATE,
		} );
		expect( updates.a.style[ '@mobile' ].layout ).toEqual( {
			columnStart: 1,
			columnSpan: 3,
			rowStart: 1,
			rowSpan: 2,
		} );
		expect( updates.b.style[ '@mobile' ].layout ).toEqual( {
			columnStart: 1,
			columnSpan: 2,
			rowStart: 3,
			rowSpan: 1,
		} );
		expect( updates.grid.style[ '@mobile' ].layout ).toEqual( {
			stackOnMobile: false,
			columnCount: 3,
			rowCount: 3,
		} );
	} );

	it( 'grows an unstacked grid without losing the unstacking', () => {
		const updates = getUpdates( {
			change: { rowSpan: 2 },
			selectedState: MOBILE_STATE,
		} );
		expect( updates.grid.style[ '@mobile' ].layout ).toEqual( {
			stackOnMobile: false,
			columnCount: 3,
			rowCount: 4,
		} );
	} );

	it( 'applies a style function with the grid as it is after unstacking', () => {
		const change = vi.fn( ( style ) => ( { ...style, marker: true } ) );
		const updates = getUpdates( { change, selectedState: MOBILE_STATE } );

		const [ childStyle, selectedState, gridAttributes ] =
			change.mock.calls[ 0 ];
		expect( childStyle[ '@mobile' ].layout ).toEqual( {
			columnStart: 1,
			columnSpan: 3,
			rowStart: 3,
			rowSpan: 1,
		} );
		expect( selectedState ).toBe( MOBILE_STATE );
		expect( gridAttributes.layout ).toBe( manualGrid.layout );
		const { '@mobile': gridMobileStyle } = gridAttributes.style;
		expect( gridMobileStyle.layout ).toEqual( {
			stackOnMobile: false,
			columnCount: 3,
			rowCount: 3,
		} );
		expect( updates.b ).toEqual( {
			style: expect.objectContaining( { marker: true } ),
		} );
	} );

	it( 'does not unstack without the grid interactivity experiment', () => {
		window.__experimentalEnableGridInteractivity = false;
		expect(
			getUpdates( {
				change: { columnSpan: 2 },
				selectedState: MOBILE_STATE,
			} )
		).toEqual( {
			b: {
				style: {
					layout: { columnStart: 2, rowStart: 1 },
					'@mobile': { layout: { columnSpan: 2 } },
				},
			},
		} );
	} );
} );
