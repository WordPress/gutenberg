import {
	getResponsiveMediaQueries,
	getViewportBreakpoints,
	getViewportBreakpointValueInPixels,
} from '../utils/viewport';

describe( 'viewport utils', () => {
	describe( 'getViewportBreakpointValueInPixels', () => {
		it( 'returns numbers unchanged', () => {
			expect( getViewportBreakpointValueInPixels( 640 ) ).toBe( 640 );
		} );

		it( 'returns pixel values as numbers', () => {
			expect( getViewportBreakpointValueInPixels( '640px' ) ).toBe( 640 );
		} );

		it( 'converts em and rem values using a 16px base font size', () => {
			expect( getViewportBreakpointValueInPixels( '40em' ) ).toBe( 640 );
			expect( getViewportBreakpointValueInPixels( '64rem' ) ).toBe(
				1024
			);
		} );

		it( 'returns undefined for unsupported values', () => {
			expect( getViewportBreakpointValueInPixels( undefined ) ).toBe(
				undefined
			);
			expect( getViewportBreakpointValueInPixels( '100%' ) ).toBe(
				undefined
			);
			expect( getViewportBreakpointValueInPixels( 'auto' ) ).toBe(
				undefined
			);
		} );
	} );

	describe( 'getViewportBreakpoints', () => {
		it( 'returns custom viewport breakpoints when they are ordered', () => {
			expect(
				getViewportBreakpoints( {
					mobile: '40rem',
					tablet: '64rem',
				} )
			).toEqual( {
				mobile: '40rem',
				tablet: '64rem',
			} );
		} );

		it( 'returns default viewport breakpoints when no custom breakpoints are valid', () => {
			expect(
				getViewportBreakpoints( {
					mobile: '100%',
					tablet: 'auto',
				} )
			).toEqual( {
				mobile: '480px',
				tablet: '782px',
			} );
		} );

		it( 'uses a valid custom breakpoint without merging defaults', () => {
			const viewportSettings = {
				mobile: ' 640px ',
				tablet: 'calc(100% - 1rem)',
				desktop: '1200px',
			};

			expect( getViewportBreakpoints( viewportSettings ) ).toEqual( {
				mobile: '640px',
			} );
		} );

		it( 'returns the configured viewport for a single breakpoint', () => {
			expect(
				getViewportBreakpoints( {
					tablet: '64rem',
				} )
			).toEqual( {
				tablet: '64rem',
			} );
		} );

		it( 'preserves the tablet key when mobile is invalid', () => {
			expect(
				getViewportBreakpoints( {
					mobile: '100%',
					tablet: '64rem',
				} )
			).toEqual( {
				tablet: '64rem',
			} );
		} );

		it( 'omits tablet when it is not larger than mobile', () => {
			expect(
				getViewportBreakpoints( {
					mobile: '64rem',
					tablet: '40rem',
				} )
			).toEqual( {
				mobile: '64rem',
			} );
		} );

		it( 'omits tablet when mobile is font-relative and tablet is in pixels', () => {
			expect(
				getViewportBreakpoints( {
					mobile: '30em',
					tablet: '500px',
				} )
			).toEqual( {
				mobile: '30em',
			} );
		} );

		it( 'omits tablet when mobile is in pixels and tablet is font-relative', () => {
			expect(
				getViewportBreakpoints( {
					mobile: '400px',
					tablet: '30em',
				} )
			).toEqual( {
				mobile: '400px',
			} );
		} );

		it( 'keeps tablet when mobile is in em and tablet is in rem', () => {
			expect(
				getViewportBreakpoints( {
					mobile: '30em',
					tablet: '40rem',
				} )
			).toEqual( {
				mobile: '30em',
				tablet: '40rem',
			} );
		} );

		it( 'keeps tablet when mobile is in rem and tablet is in em', () => {
			expect(
				getViewportBreakpoints( {
					mobile: '30rem',
					tablet: '40em',
				} )
			).toEqual( {
				mobile: '30rem',
				tablet: '40em',
			} );
		} );
	} );

	describe( 'getResponsiveMediaQueries', () => {
		it( 'returns custom media queries when viewport breakpoints are ordered', () => {
			expect(
				getResponsiveMediaQueries( {
					mobile: '640px',
					tablet: '960px',
				} )
			).toEqual( {
				'@mobile': '@media (width <= 640px)',
				'@tablet': '@media (640px < width <= 960px)',
			} );
		} );

		it( 'returns default media queries when no custom breakpoints are valid', () => {
			expect(
				getResponsiveMediaQueries( {
					mobile: '100%',
					tablet: 'auto',
				} )
			).toEqual( {
				'@mobile': '@media (width <= 480px)',
				'@tablet': '@media (480px < width <= 782px)',
			} );
		} );

		it( 'uses a valid custom media query without merging defaults', () => {
			expect(
				getResponsiveMediaQueries( {
					mobile: ' 640px ',
					tablet: 'calc(100% - 1rem)',
				} )
			).toEqual( {
				'@mobile': '@media (width <= 640px)',
			} );
		} );

		it( 'uses a single max-width tablet media query when only tablet is valid', () => {
			expect(
				getResponsiveMediaQueries( {
					mobile: '100%',
					tablet: '64rem',
				} )
			).toEqual( {
				'@tablet': '@media (width <= 64rem)',
			} );
		} );

		it( 'omits the tablet media query when the tablet breakpoint is not larger than mobile', () => {
			expect(
				getResponsiveMediaQueries( {
					mobile: '960px',
					tablet: '640px',
				} )
			).toEqual( {
				'@mobile': '@media (width <= 960px)',
			} );
		} );

		it( 'omits the tablet media query when the breakpoints do not share a base', () => {
			expect(
				getResponsiveMediaQueries( {
					mobile: '30em',
					tablet: '500px',
				} )
			).toEqual( {
				'@mobile': '@media (width <= 30em)',
			} );

			expect(
				getResponsiveMediaQueries( {
					mobile: '400px',
					tablet: '30em',
				} )
			).toEqual( {
				'@mobile': '@media (width <= 400px)',
			} );
		} );

		it( 'returns a tablet media query when the breakpoints share a base', () => {
			expect(
				getResponsiveMediaQueries( {
					mobile: '30em',
					tablet: '40rem',
				} )
			).toEqual( {
				'@mobile': '@media (width <= 30em)',
				'@tablet': '@media (30em < width <= 40rem)',
			} );
		} );
	} );
} );
