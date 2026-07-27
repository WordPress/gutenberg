/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useSettings, useStyleOverride } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import useLayoutCustomProperties from '../use-layout-custom-properties';

const mockGetResponsiveMediaQueries = jest.fn();

jest.mock( '@wordpress/block-editor', () => ( {
	useSettings: jest.fn(),
	useStyleOverride: jest.fn(),
} ) );

jest.mock( '@wordpress/global-styles-engine', () => ( {
	privateApis: {},
} ) );

jest.mock( '../../../lock-unlock', () => ( {
	unlock: () => ( {
		getResponsiveMediaQueries: ( ...args ) =>
			mockGetResponsiveMediaQueries( ...args ),
	} ),
} ) );

describe( 'Navigation layout custom properties', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		useSettings.mockReturnValue( [ { mobile: 480, tablet: 782 } ] );
		mockGetResponsiveMediaQueries.mockReturnValue( {
			'@tablet': '@media (480px < width <= 782px)',
			'@mobile': '@media (width <= 480px)',
		} );
	} );

	describe( 'vertical layouts', () => {
		it.each( [
			[ 'left', 'initial', 'flex-start' ],
			[ 'center', 'center', 'center' ],
			[ 'right', 'flex-end', 'flex-end' ],
			[ 'space-between', 'space-between', 'flex-start' ],
		] )(
			'reproduces the vertical %s class cascade',
			( justifyContent, justify, align ) => {
				renderHook( () =>
					useLayoutCustomProperties( {
						clientId: 'test',
						style: {
							'@mobile': {
								layout: {
									orientation: 'vertical',
									justifyContent,
									flexWrap: 'nowrap',
								},
							},
						},
					} )
				);

				const { css } = useStyleOverride.mock.calls.at( -1 )[ 0 ];
				expect( css ).toContain(
					'--navigation-layout-direction: column;'
				);
				expect( css ).toContain( '--navigation-layout-wrap: nowrap;' );
				expect( css ).toContain(
					`--navigation-layout-justify: ${ justify };`
				);
				expect( css ).toContain(
					`--navigation-layout-align: ${ align };`
				);
			}
		);
	} );

	describe( 'responsive styles', () => {
		it( 'merges viewport overrides with the base layout', () => {
			renderHook( () =>
				useLayoutCustomProperties( {
					clientId: 'test',
					layout: {
						justifyContent: 'right',
						flexWrap: 'nowrap',
					},
					style: {
						'@mobile': {
							layout: { orientation: 'vertical' },
						},
					},
				} )
			);

			expect( useStyleOverride ).toHaveBeenCalledWith( {
				css: '@media (width <= 480px){#block-test {--navigation-layout-justification-setting: flex-end;--navigation-layout-direction: column;--navigation-layout-wrap: nowrap;--navigation-layout-justify: flex-end;--navigation-layout-align: flex-end;}}',
			} );
		} );

		it( 'uses default values for explicit viewport resets', () => {
			renderHook( () =>
				useLayoutCustomProperties( {
					clientId: 'test',
					layout: { justifyContent: 'right' },
					style: {
						'@tablet': {
							layout: { justifyContent: null },
						},
					},
				} )
			);

			expect( useStyleOverride ).toHaveBeenCalledWith( {
				css: expect.stringContaining(
					'--navigation-layout-justify: flex-start;'
				),
			} );
		} );

		it( 'does not emit styles without a viewport layout override', () => {
			renderHook( () =>
				useLayoutCustomProperties( {
					clientId: 'test',
					style: {
						'@mobile': { spacing: { blockGap: '10px' } },
					},
				} )
			);

			expect( useStyleOverride ).toHaveBeenCalledWith( { css: '' } );
		} );
	} );
} );
