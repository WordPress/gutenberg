/**
 * Internal dependencies
 */
import { dcnpgettext, sprintf } from '../';

// Mock memoization as identity function. Inline since Jest errors on out-of-
// scope references in a mock callback.
jest.mock( 'memize', () => ( fn ) => fn );

describe( 'i18n', () => {
	describe( 'dcnpgettext()', () => {
		it( 'absorbs errors', () => {
			const result = dcnpgettext( 'domain-without-data', undefined, 'Hello' );

			expect( console ).toHaveErrored();
			expect( result ).toBe( 'Hello' );
		} );
	} );

	describe( 'sprintf()', () => {
		it( 'absorbs errors', () => {
			const result = sprintf( 'Hello %(placeholder-not-provided)s' );

			expect( console ).toHaveErrored();
			expect( result ).toBe( 'Hello %(placeholder-not-provided)s' );
		} );
	} );
} );
