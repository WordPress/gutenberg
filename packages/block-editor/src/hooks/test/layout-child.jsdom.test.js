import { describe, expect, it } from 'vitest';
import {
	getChildLayoutStyleRules,
	getChildLayoutStyles,
	getResponsiveChildLayoutStyles,
	getUpdatedChildLayoutStyle,
} from '../layout-child';

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

	describe( 'rotation', () => {
		it( 'outputs a rotate declaration for a rotated grid child', () => {
			expect(
				getChildLayoutStyleRules( {
					selector: '.wp-container-content-test',
					layout: { columnStart: 2, rowStart: 1, rotate: -15 },
					parentLayout: { columnCount: 3 },
				} )
			).toEqual( [
				{
					selector: '.wp-container-content-test',
					declarations: {
						'grid-column': '2',
						'grid-row': '1',
						rotate: '-15deg',
					},
				},
			] );
		} );

		it( 'does not output rotation of 0 in the default state', () => {
			expect(
				getChildLayoutStyleRules( {
					selector: '.wp-container-content-test',
					layout: { rotate: 0 },
				} )
			).toEqual( [] );
		} );

		it( 'resets rotation when a viewport override sets it to 0', () => {
			expect(
				getChildLayoutStyleRules( {
					selector: '.wp-container-content-test',
					layout: { columnStart: 2, rotate: 30 },
					viewportOverrides: { rotate: 0 },
				} )
			).toEqual( [
				{
					selector: '.wp-container-content-test',
					declarations: { rotate: 'none' },
				},
			] );
		} );

		it( 'outputs viewport rotation overrides in media queries', () => {
			const css = getResponsiveChildLayoutStyles( {
				style: {
					layout: { rotate: 30 },
					'@tablet': { layout: { rotate: 10 } },
				},
				selector: '.wp-container-content-test',
			} );
			expect( css ).toContain( '@media' );
			expect( css ).toContain( 'rotate: 10deg' );
			expect( css ).not.toContain( 'rotate: 30deg' );
		} );
	} );

	describe( 'row span for mobile stacking', () => {
		it( 'publishes the row span of a manual grid child', () => {
			expect(
				getChildLayoutStyleRules( {
					selector: '.wp-container-content-test',
					layout: { columnStart: 1, rowStart: 1, rowSpan: 2 },
					parentLayout: { isManualPlacement: true, columnCount: 3 },
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
					parentLayout: { isManualPlacement: true, columnCount: 3 },
				} )[ 0 ].declarations[ '--wp--grid-item--row-span' ]
			).toBe( '1' );
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
