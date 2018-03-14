/**
 * Internal dependencies
 */
import { dcnpgettext, sprintf } from '../';

describe( 'i18n', () => {
	describe( 'dcnpgettext()', () => {
		it( 'absorbs errors', () => {
			const result = dcnpgettext( 'domain-without-data', undefined, 'Hello' );

			expect( console ).toHaveErrored();
			expect( result ).toBe( 'Hello' );
		} );

		it( 'decodes entities', () => {
			const result = dcnpgettext( undefined, undefined, 'Ribs &amp; Chicken' );

			expect( result ).toBe( 'Ribs & Chicken' );
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
