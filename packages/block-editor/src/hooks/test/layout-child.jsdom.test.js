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

describe( 'freeform child layout', () => {
	const parentLayout = { type: 'freeform', canvasHeight: 800 };

	it( 'turns design-space coordinates into percentages of the canvas', () => {
		expect(
			getChildLayoutStyleRules( {
				selector: '.wp-container-content-test',
				layout: { x: 300, y: 150, width: 240, height: 80 },
				parentLayout,
			} )
		).toEqual( [
			{
				selector: '.wp-container-content-test',
				declarations: {
					left: '25%',
					top: '18.75%',
					width: '20%',
					'min-height': '10%',
					'box-sizing': 'border-box',
				},
			},
		] );
	} );

	it( 'treats a missing coordinate as the canvas origin', () => {
		expect(
			getChildLayoutStyleRules( {
				selector: '.wp-container-content-test',
				layout: { width: 600 },
				parentLayout,
			} )
		).toEqual( [
			{
				selector: '.wp-container-content-test',
				declarations: {
					left: '0%',
					top: '0%',
					width: '50%',
					'box-sizing': 'border-box',
				},
			},
		] );
	} );

	it( 'rounds to two decimal places', () => {
		const [ rule ] = getChildLayoutStyleRules( {
			selector: '.wp-container-content-test',
			layout: { x: 100, y: 100, width: 100, height: 100 },
			parentLayout: { type: 'freeform', canvasHeight: 700 },
		} );

		expect( rule.declarations.left ).toBe( '8.33%' );
		expect( rule.declarations.top ).toBe( '14.29%' );
	} );

	it( 'ignores freeform coordinates when the parent is not a freeform canvas', () => {
		expect(
			getChildLayoutStyleRules( {
				selector: '.wp-container-content-test',
				layout: { x: 300, y: 150, width: 240, height: 80 },
				parentLayout: { type: 'grid' },
			} )
		).toEqual( [] );
	} );

	it( 'emits no container query for a freeform child', () => {
		const rules = getChildLayoutStyleRules( {
			selector: '.wp-container-content-test',
			layout: { x: 300, y: 150, width: 240, height: 80 },
			parentLayout,
		} );

		expect( rules.every( ( rule ) => ! rule.rulesGroup ) ).toBe( true );
	} );

	it( 'serializes to CSS', () => {
		expect(
			getChildLayoutStyles( {
				selector: '.wp-container-content-test',
				layout: { x: 600, y: 400, width: 300, height: 200 },
				parentLayout,
			} )
		).toContain( 'left: 50%' );
	} );
} );
