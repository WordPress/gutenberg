/**
 * Internal dependencies
 */
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

		it( 'uses a single valid custom breakpoint as mobile-only', () => {
			expect(
				getViewportBreakpoints( {
					tablet: '64rem',
				} )
			).toEqual( {
				mobile: '64rem',
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
	} );

	describe( 'getResponsiveMediaQueries', () => {
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
	} );
} );
