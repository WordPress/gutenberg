// Mock memoization as identity function. Inline since Jest errors on
// out-of-scope references in a mock callback.
jest.mock( 'memize', () => ( fn ) => fn );

/**
 * Internal dependencies
 */
import { sprintf } from '../sprintf';

describe( 'i18n', () => {
	describe( 'sprintf', () => {
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
