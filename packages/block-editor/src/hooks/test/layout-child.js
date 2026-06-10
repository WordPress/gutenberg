/**
 * Internal dependencies
 */
import { getChildLayoutStyleRules } from '../layout-child';

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

		it( 'allows viewport overrides to switch fixedNoShrink to max width', () => {
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
						'box-sizing': 'border-box',
					},
				},
			] );
		} );
	} );
} );
