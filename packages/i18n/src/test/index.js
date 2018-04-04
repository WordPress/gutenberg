/**
 * Internal dependencies
 */
import { dcnpgettext, sprintf, __, _x, _n, _nx, setLocaleData } from '../';

// Mock memoization as identity function. Inline since Jest errors on out-of-
// scope references in a mock callback.
jest.mock( 'memize', () => ( fn ) => fn );

const localeData = {
	"" : {
		// Domain name
		"domain" : "test_domain",
		"lang" : "fr",
		// Plural form function for language
		"plural_forms" : "nplurals=2; plural=(n != 1);"
	},

	"hello" : [ "bonjour" ],

	"verb\u0004feed": [ "nourrir" ],

	"hello %s": [ "bonjour %s"],

	"%d banana" : [ "une banane", "%d bananes" ],

	"fruit\u0004%d apple" : [ "une pomme", "%d pommes" ],
}
setLocaleData( localeData, 'test_domain' );

describe( 'i18n', () => {
	describe( 'dcnpgettext()', () => {
		it( 'absorbs errors', () => {
			const result = dcnpgettext( 'domain-without-data', undefined, 'Hello' );

			expect( console ).toHaveErrored();
			expect( result ).toBe( 'Hello' );
		} );
	} );

	describe( '__', () => {
		it( 'use the translation', () => {
			expect( __( 'hello', 'test_domain' ) ).toBe( 'bonjour' );
		} );
	} );

	describe( '_x', () => {
		it( 'use the translation with context', () => {
			expect( _x( 'feed', 'verb', 'test_domain' ) ).toBe( 'nourrir' );
		} );
	} );

	describe( '_n', () => {
		it( 'use the plural form', () => {
			expect( _n( '%d banana', '%d bananas', 3, 'test_domain' ) ).toBe( '%d bananes' );
		} );

		it( 'use the singular form', () => {
			expect( _n( '%d banana', '%d bananas', 1, 'test_domain' ) ).toBe( 'une banane' );
		} );
	} );

	describe( '_nx', () => {
		it( 'use the plural form', () => {
			expect( _nx( '%d apple', '%d apples', 3, 'fruit', 'test_domain' ) ).toBe( '%d pommes' );
		} );

		it( 'use the singular form', () => {
			expect( _nx( '%d apple', '%d apples', 1, 'fruit', 'test_domain' ) ).toBe( 'une pomme' );
		} );
	} );

	describe( 'sprintf()', () => {
		it( 'absorbs errors', () => {
			const result = sprintf( 'Hello %(placeholder-not-provided)s' );

			expect( console ).toHaveErrored();
			expect( result ).toBe( 'Hello %(placeholder-not-provided)s' );
		} );

		it( 'replaces placeholders', () => {
			const result = sprintf( __( 'hello %s', 'test_domain'), 'Riad' );

			expect( result ).toBe( 'bonjour Riad' );
		} );
	} );
} );
