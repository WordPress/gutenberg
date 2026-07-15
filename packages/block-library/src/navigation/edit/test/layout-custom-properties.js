/**
 * Internal dependencies
 */
import {
	getNavigationLayoutCustomProperties,
	getNavigationResponsiveLayoutCSS,
} from '../layout-custom-properties';

describe( 'Navigation layout custom properties', () => {
	describe( 'getNavigationLayoutCustomProperties', () => {
		it( 'returns the default horizontal layout properties', () => {
			expect( getNavigationLayoutCustomProperties() ).toEqual( {
				'--navigation-layout-justification-setting': 'flex-start',
				'--navigation-layout-direction': 'row',
				'--navigation-layout-wrap': 'wrap',
				'--navigation-layout-justify': 'flex-start',
				'--navigation-layout-align': 'center',
			} );
		} );

		it.each( [
			[ 'left', 'initial', 'flex-start' ],
			[ 'center', 'center', 'center' ],
			[ 'right', 'flex-end', 'flex-end' ],
			[ 'space-between', 'space-between', 'flex-start' ],
		] )(
			'reproduces the vertical %s class cascade',
			( justifyContent, justify, align ) => {
				expect(
					getNavigationLayoutCustomProperties( {
						orientation: 'vertical',
						justifyContent,
						flexWrap: 'nowrap',
					} )
				).toMatchObject( {
					'--navigation-layout-direction': 'column',
					'--navigation-layout-wrap': 'nowrap',
					'--navigation-layout-justify': justify,
					'--navigation-layout-align': align,
				} );
			}
		);
	} );

	describe( 'getNavigationResponsiveLayoutCSS', () => {
		it( 'merges viewport overrides with the base layout', () => {
			expect(
				getNavigationResponsiveLayoutCSS( {
					selector: '#block-test',
					layout: {
						justifyContent: 'right',
						flexWrap: 'nowrap',
					},
					style: {
						'@mobile': {
							layout: { orientation: 'vertical' },
						},
					},
					mediaQueries: {
						'@mobile': '@media (width <= 480px)',
					},
				} )
			).toBe(
				'@media (width <= 480px){#block-test {--navigation-layout-justification-setting: flex-end;--navigation-layout-direction: column;--navigation-layout-wrap: nowrap;--navigation-layout-justify: flex-end;--navigation-layout-align: flex-end;}}'
			);
		} );

		it( 'uses default values for explicit viewport resets', () => {
			expect(
				getNavigationResponsiveLayoutCSS( {
					selector: '#block-test',
					layout: { justifyContent: 'right' },
					style: {
						'@tablet': {
							layout: { justifyContent: null },
						},
					},
					mediaQueries: {
						'@tablet': '@media (480px < width <= 782px)',
					},
				} )
			).toContain( '--navigation-layout-justify: flex-start;' );
		} );

		it( 'does not emit styles without a viewport layout override', () => {
			expect(
				getNavigationResponsiveLayoutCSS( {
					selector: '#block-test',
					style: {
						'@mobile': { spacing: { blockGap: '10px' } },
					},
					mediaQueries: {
						'@mobile': '@media (width <= 480px)',
					},
				} )
			).toBe( '' );
		} );
	} );
} );
