/**
 * Internal dependencies
 */
import { camelCaseDash } from '../string';

describe( 'string', () => {
	describe( 'camelCaseDash', () => {
		test( 'does not change a single word', () => {
			expect( camelCaseDash( 'blocks' ) ).toBe( 'blocks' );
			expect( camelCaseDash( 'dom' ) ).toBe( 'dom' );
		} );

		test( 'does not capitalize letters following numbers', () => {
			expect( camelCaseDash( 'a11y' ) ).toBe( 'a11y' );
			expect( camelCaseDash( 'i18n' ) ).toBe( 'i18n' );
		} );

		test( 'converts dashes into camel case', () => {
			expect( camelCaseDash( 'api-fetch' ) ).toBe( 'apiFetch' );
			expect( camelCaseDash( 'list-reusable-blocks' ) ).toBe(
				'listReusableBlocks'
			);
		} );
	} );
} );
