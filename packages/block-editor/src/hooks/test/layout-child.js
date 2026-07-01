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
} );
