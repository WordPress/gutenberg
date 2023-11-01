// Mock memoization as identity function. Inline since Jest errors on
// out-of-scope references in a mock callback.
jest.mock( 'memize', () => ( fn ) => fn );

/**
 * Internal dependencies
 */
import { sprintf } from '../sprintf';

describe( 'i18n', () => {
	describe( 'sprintf', () => {
		it( 'absorbs errors', () => {
			// Disable reason: Failing case is the purpose of the test.
			// eslint-disable-next-line @wordpress/valid-sprintf
			const result = sprintf( 'Hello %(placeholder-not-provided)s' );

			expect( console ).toHaveErrored();
			expect( result ).toBe( 'Hello %(placeholder-not-provided)s' );
		} );

		it( 'replaces placeholders', () => {
			const result = sprintf( 'bonjour %s', 'Riad' );

			expect( result ).toBe( 'bonjour Riad' );
		} );

		it( 'replaces named placeholders', () => {
			const result = sprintf( 'bonjour %(name)s', { name: 'Riad' } );

			expect( result ).toBe( 'bonjour Riad' );
		} );
	} );
} );
