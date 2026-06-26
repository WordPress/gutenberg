/**
 * Internal dependencies
 */
import { getViewportBreakpointValueInPixels } from '../utils/viewport';

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
} );
