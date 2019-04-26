/**
 * Internal dependencies
 */
import { escape, unescape } from '../utils';

describe( 'core/code', () => {
	describe( 'escape()', () => {
		it( 'should escape ampersands', () => {
			const text = escape( '&' );
			expect( text ).toBe( '&amp;' );
		} );

		it( 'should escape opening square brackets', () => {
			const text = escape( '[shortcode][/shortcode]' );
			expect( text ).toBe( '&#91;shortcode]&#91;/shortcode]' );
		} );

		it( 'should escape the protocol of an isolated url', () => {
			const text = escape( 'https://example.com/test/' );
			expect( text ).toBe( 'https:&#47;&#47;example.com/test/' );
		} );

		it( 'should not escape the protocol of a non isolated url', () => {
			const text = escape( 'Text https://example.com/test/' );
			expect( text ).toBe( 'Text https://example.com/test/' );
		} );

		it( 'should escape ampersands last', () => {
			const text = escape( '[shortcode][/shortcode]' );
			expect( text ).toBe( '&#91;shortcode]&#91;/shortcode]' );
			expect( text ).not.toBe( '&amp;#91;shortcode]&amp;#91;/shortcode]' );
		} );
	} );

	describe( 'unescape()', () => {
		it( 'should unescape escaped ampersands', () => {
			const text = unescape( '&amp;' );
			expect( text ).toBe( '&' );
		} );

		it( 'should unescape escaped opening square brackets', () => {
			const text = unescape( '&#91;shortcode]&#91;/shortcode]' );
			expect( text ).toBe( '[shortcode][/shortcode]' );
		} );

		it( 'should unescape the escaped protocol of an isolated url', () => {
			const text = unescape( 'https:&#47;&#47;example.com/test/' );
			expect( text ).toBe( 'https://example.com/test/' );
		} );

		it( 'should revert the result of escape()', () => {
			const ampersand = unescape( escape( '&' ) );
			expect( ampersand ).toBe( '&' );

			const squareBracket = unescape( escape( '[shortcode][/shortcode]' ) );
			expect( squareBracket ).toBe( '[shortcode][/shortcode]' );

			const url = unescape( escape( 'https://example.com/test/' ) );
			expect( url ).toBe( 'https://example.com/test/' );
		} );
	} );
} );
