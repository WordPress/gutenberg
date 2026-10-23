import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	getChildLayoutStyleRules,
	getChildLayoutStyles,
	getResponsiveChildLayoutStyles,
	hasGridItemBoxInAnyState,
} from '../layout-child';
import { getUpdatedChildLayoutStyle } from '../block-style-state';
import { getGridItemBox } from '../../components/grid/free-placement';

describe( 'layout child', () => {
	describe( 'getChildLayoutStyleRules()', () => {
		it( 'preserves legacy fixed sizing as shrinkable max width', () => {
			expect(
				getChildLayoutStyleRules( {
					selector: '.wp-container-content-test',
					layout: {
						selfStretch: 'fixed',
						flexSize: '320px',
					},
				} )
			).toEqual( [
				{
					selector: '.wp-container-content-test',
					declarations: {
						'flex-basis': '320px',
						'box-sizing': 'border-box',
					},
				},
			] );
		} );

		it( 'adds flex-shrink for fixedNoShrink sizing', () => {
			expect(
				getChildLayoutStyleRules( {
					selector: '.wp-container-content-test',
					layout: {
						selfStretch: 'fixedNoShrink',
						flexSize: '320px',
					},
				} )
			).toEqual( [
				{
					selector: '.wp-container-content-test',
					declarations: {
						'flex-basis': '320px',
						'flex-shrink': '0',
						'box-sizing': 'border-box',
					},
				},
			] );
		} );

		it( 'allows viewport overrides to switch fixedNoShrink to max', () => {
			expect(
				getChildLayoutStyleRules( {
					selector: '.wp-container-content-test',
					layout: {
						selfStretch: 'fixedNoShrink',
						flexSize: '320px',
					},
					viewportOverrides: {
						selfStretch: 'fixed',
					},
				} )
			).toEqual( [
				{
					selector: '.wp-container-content-test',
					declarations: {
						'flex-basis': '320px',
						'flex-shrink': 'unset',
						'box-sizing': 'border-box',
					},
				},
			] );
		} );

		it( 'allows viewport overrides to switch fixedNoShrink to fit', () => {
			expect(
				getChildLayoutStyleRules( {
					selector: '.wp-container-content-test',
					layout: {
						selfStretch: 'fixedNoShrink',
						flexSize: '320px',
					},
					viewportOverrides: {
						selfStretch: 'fit',
					},
				} )
			).toEqual( [
				{
					selector: '.wp-container-content-test',
					declarations: {
						'flex-basis': 'unset',
						'flex-shrink': 'unset',
					},
				},
			] );
		} );

		it( 'allows viewport overrides to switch fixed to fit', () => {
			expect(
				getChildLayoutStyleRules( {
					selector: '.wp-container-content-test',
					layout: {
						selfStretch: 'fixed',
						flexSize: '320px',
					},
					viewportOverrides: {
						selfStretch: 'fit',
					},
				} )
			).toEqual( [
				{
					selector: '.wp-container-content-test',
					declarations: {
						'flex-basis': 'unset',
					},
				},
			] );
		} );

		it( 'allows viewport overrides to switch fixedNoShrink to grow', () => {
			expect(
				getChildLayoutStyleRules( {
					selector: '.wp-container-content-test',
					layout: {
						selfStretch: 'fixedNoShrink',
						flexSize: '320px',
					},
					viewportOverrides: {
						selfStretch: 'fill',
					},
				} )
			).toEqual( [
				{
					selector: '.wp-container-content-test',
					declarations: {
						'flex-basis': 'unset',
						'flex-shrink': 'unset',
						'flex-grow': '1',
					},
				},
			] );
		} );

		it( 'allows viewport overrides to switch fixed to grow', () => {
			expect(
				getChildLayoutStyleRules( {
					selector: '.wp-container-content-test',
					layout: {
						selfStretch: 'fixed',
						flexSize: '320px',
					},
					viewportOverrides: {
						selfStretch: 'fill',
					},
				} )
			).toEqual( [
				{
					selector: '.wp-container-content-test',
					declarations: {
						'flex-basis': 'unset',
						'flex-grow': '1',
					},
				},
			] );
		} );
	} );

	describe( 'row span for mobile stacking', () => {
		const manualGrid = { isManualPlacement: true, columnCount: 3 };

		let originalExperiment: boolean | undefined;
		beforeEach( () => {
			originalExperiment = window.__experimentalEnableGridInteractivity;
			window.__experimentalEnableGridInteractivity = true;
		} );
		afterEach( () => {
			window.__experimentalEnableGridInteractivity = originalExperiment;
		} );

		it( 'publishes the row span of a manual grid child', () => {
			expect(
				getChildLayoutStyleRules( {
					selector: '.wp-container-content-test',
					layout: { columnStart: 1, rowStart: 1, rowSpan: 2 },
					parentLayout: manualGrid,
				} )
			).toEqual( [
				{
					selector: '.wp-container-content-test',
					declarations: {
						'grid-column': '1',
						'grid-row': '1 / span 2',
						'--wp--grid-item--row-span': '2',
					},
				},
			] );
		} );

		it( 'publishes a row span of 1 so nested grids do not inherit one', () => {
			expect(
				getChildLayoutStyleRules( {
					selector: '.wp-container-content-test',
					layout: { columnStart: 2, rowStart: 1 },
					parentLayout: manualGrid,
				} )[ 0 ].declarations[ '--wp--grid-item--row-span' ]
			).toBe( '1' );
		} );

		it( 'does not publish the row span in viewport overrides', () => {
			expect(
				getChildLayoutStyleRules( {
					selector: '.wp-container-content-test',
					layout: { columnStart: 1, rowStart: 1, rowSpan: 2 },
					viewportOverrides: { rowSpan: 3 },
					parentLayout: manualGrid,
				} )[ 0 ].declarations
			).toEqual( { 'grid-row': '1 / span 3' } );
		} );

		it( 'does not publish the row span in auto placement grids', () => {
			expect(
				getChildLayoutStyleRules( {
					selector: '.wp-container-content-test',
					layout: { rowSpan: 2 },
					parentLayout: { columnCount: 3 },
				} )[ 0 ].declarations
			).toEqual( { 'grid-row': 'span 2' } );
		} );

		it( 'does not publish the row span without the grid interactivity experiment', () => {
			window.__experimentalEnableGridInteractivity = false;
			expect(
				getChildLayoutStyleRules( {
					selector: '.wp-container-content-test',
					layout: { rowSpan: 2 },
					parentLayout: manualGrid,
				} )[ 0 ].declarations
			).toEqual( { 'grid-row': 'span 2' } );
		} );
	} );

	describe( 'free box in manual grids', () => {
		const manualGrid = {
			isManualPlacement: true,
			columnCount: 4,
			rowCount: 4,
		};
		const selector = '.wp-container-content-test';
		const box = { left: 0.1563, top: 0.0625, width: 0.6563, height: 0.7 };
		const placement = {
			columnStart: 1,
			columnSpan: 3,
			rowStart: 1,
			rowSpan: 1,
		};
		const noBox = {
			'--wp--grid-item--box-left': '0%',
			'--wp--grid-item--box-top': '0%',
			'--wp--grid-item--box-width': '100%',
			'--wp--grid-item--box-height': '100%',
		};

		let originalExperiment: boolean | undefined;
		beforeEach( () => {
			originalExperiment = window.__experimentalEnableGridInteractivity;
			window.__experimentalEnableGridInteractivity = true;
		} );
		afterEach( () => {
			window.__experimentalEnableGridInteractivity = originalExperiment;
		} );

		it( 'emits box vars and the fixed-cells rule for a block with a box', () => {
			expect(
				getChildLayoutStyleRules( {
					selector,
					layout: { ...placement, box },
					parentLayout: manualGrid,
					hasBox: true,
				} )
			).toEqual( [
				{
					selector,
					declarations: {
						'grid-column': '1 / span 3',
						'grid-row': '1 / span 1',
						'--wp--grid-item--row-span': '1',
						'--wp--grid-item--box-left': '15.63%',
						'--wp--grid-item--box-top': '6.25%',
						'--wp--grid-item--box-width': '65.63%',
						'--wp--grid-item--box-height': '70%',
					},
				},
				{
					rulesGroup:
						'@container style(--wp--style--grid-cells: fixed)',
					selector,
					declarations: {
						'justify-self': 'start',
						'align-self': 'start',
						'box-sizing': 'border-box',
						'margin-left':
							'var(--wp--grid-item--box-left) !important',
						'margin-top':
							'var(--wp--grid-item--box-top) !important',
						width: 'var(--wp--grid-item--box-width)',
						height: 'var(--wp--grid-item--box-height)',
					},
				},
			] );
		} );

		it( 'sets no-box values in the base rule when only a viewport has a box', () => {
			const style = {
				layout: placement,
				'@mobile': {
					layout: {
						columnStart: 2,
						columnSpan: 1,
						rowStart: 1,
						rowSpan: 1,
						box,
					},
				},
			};
			expect( hasGridItemBoxInAnyState( style ) ).toBe( true );
			expect(
				getChildLayoutStyleRules( {
					selector,
					layout: style.layout,
					parentLayout: manualGrid,
					hasBox: true,
				} )[ 0 ].declarations
			).toMatchObject( noBox );
			const mobileRules = getChildLayoutStyleRules( {
				selector,
				layout: style.layout,
				viewportOverrides: style[ '@mobile' ].layout,
				parentLayout: manualGrid,
				hasBox: true,
			} );
			expect( mobileRules ).toHaveLength( 1 );
			expect( mobileRules[ 0 ].declarations ).toMatchObject( {
				'--wp--grid-item--box-left': '15.63%',
				'--wp--grid-item--box-height': '70%',
			} );
		} );

		it( 'viewport override with only columnStart has no box', () => {
			expect(
				getGridItemBox( { ...placement, box }, { columnStart: 2 } )
			).toBeUndefined();
			expect(
				getChildLayoutStyleRules( {
					selector,
					layout: { ...placement, box },
					viewportOverrides: { columnStart: 2 },
					parentLayout: manualGrid,
					hasBox: true,
				} )[ 0 ].declarations
			).toEqual( { 'grid-column': '2 / span 3', ...noBox } );
		} );

		it( 'inherits the base box in a viewport override without a placement', () => {
			expect(
				getGridItemBox( { ...placement, box }, { selfStretch: 'fit' } )
			).toEqual( box );
			expect(
				getChildLayoutStyleRules( {
					selector,
					layout: { ...placement, box },
					viewportOverrides: { selfStretch: 'fit' },
					parentLayout: manualGrid,
					hasBox: true,
				} )
			).toEqual( [] );
		} );

		it( 'ignores a box the front end would ignore', () => {
			expect(
				getGridItemBox( { box: { ...box, width: 2 } } )
			).toBeUndefined();
			expect(
				getGridItemBox( { box: { ...box, left: -0.01 } } )
			).toBeUndefined();
			expect(
				getGridItemBox( { box: { ...box, left: 1.5, width: 0.1 } } )
			).toBeUndefined();
			expect(
				getGridItemBox( { box: { ...box, left: 0.5, width: 0.6 } } )
			).toBeUndefined();
			// Rounded values can end a little past the cells.
			expect(
				getGridItemBox( {
					box: { ...box, left: 0.1563, width: 0.8438 },
				} )
			).toBeDefined();
			expect(
				getGridItemBox( {
					// A stored attribute can hold any value.
					box: { ...box, height: '0.5' as unknown as number },
				} )
			).toBeUndefined();
			expect( getGridItemBox( { box } ) ).toEqual( box );
		} );

		it( 'emits nothing extra without a box anywhere', () => {
			expect( hasGridItemBoxInAnyState( { layout: placement } ) ).toBe(
				false
			);
			expect(
				getChildLayoutStyleRules( {
					selector,
					layout: placement,
					parentLayout: manualGrid,
					hasBox: false,
				} )
			).toEqual( [
				{
					selector,
					declarations: {
						'grid-column': '1 / span 3',
						'grid-row': '1 / span 1',
						'--wp--grid-item--row-span': '1',
					},
				},
			] );
		} );

		it( 'emits nothing extra with the experiment off', () => {
			window.__experimentalEnableGridInteractivity = false;
			expect(
				getChildLayoutStyleRules( {
					selector,
					layout: { ...placement, box },
					parentLayout: manualGrid,
					hasBox: true,
				} )
			).toEqual( [
				{
					selector,
					declarations: {
						'grid-column': '1 / span 3',
						'grid-row': '1 / span 1',
					},
				},
			] );
		} );

		it( 'serializes the fixed-cells rule inside its container query', () => {
			const css = getChildLayoutStyles( {
				selector,
				layout: { ...placement, box },
				parentLayout: manualGrid,
				hasBox: true,
			} );
			expect( css ).toContain(
				'@container style(--wp--style--grid-cells: fixed)'
			);
			expect( css ).toContain(
				'margin-left: var(--wp--grid-item--box-left) !important'
			);
		} );
	} );

	describe( 'getUpdatedChildLayoutStyle()', () => {
		it( 'stores resizer changes in the selected viewport when no default child layout exists', () => {
			const style = getUpdatedChildLayoutStyle(
				undefined,
				{
					columnSpan: 2,
					rowSpan: 1,
				},
				{
					viewport: '@mobile',
					pseudo: 'default',
				}
			);

			expect(
				getChildLayoutStyles( {
					selector: '.wp-container-content-test',
					layout: style?.layout,
				} )
			).toBe( '' );
			expect(
				getResponsiveChildLayoutStyles( {
					style,
					selector: '.wp-container-content-test',
				} )
			).toBe(
				'@media (width <= 480px){.wp-container-content-test {\n\t\tgrid-column: span 2; grid-row: span 1;\n\t}}'
			);
		} );

		it( 'stores resizer changes in the selected viewport when a pseudo state is also selected', () => {
			expect(
				getUpdatedChildLayoutStyle(
					undefined,
					{
						columnSpan: 2,
						rowSpan: 1,
					},
					{
						viewport: '@mobile',
						pseudo: ':hover',
					}
				)
			).toEqual( {
				'@mobile': {
					layout: {
						columnSpan: 2,
						rowSpan: 1,
					},
				},
			} );
		} );
	} );
} );
