/**
 * Internal dependencies
 */
import { createCssString } from '../create-css-string';

describe( 'createCssString', () => {
	it( 'should wrap a simple name in double quotes', () => {
		expect( createCssString( 'Arial' ) ).toBe( '"Arial"' );
	} );

	it( 'should preserve leading and trailing spaces', () => {
		expect( createCssString( '  Arial  ' ) ).toBe( '"  Arial  "' );
	} );

	it( 'should escape single quotes', () => {
		expect( createCssString( "O'Brien" ) ).toBe( '"O\\27 Brien"' );
	} );

	it( 'should escape double quotes', () => {
		expect( createCssString( 'Say "Hi"' ) ).toBe(
			'"Say \\22 Hi\\22 "'
		);
	} );

	it( 'should escape backslashes', () => {
		expect( createCssString( 'Back\\Slash' ) ).toBe(
			'"Back\\5C Slash"'
		);
	} );

	it( 'should escape backslashes before quotes (order matters)', () => {
		expect( createCssString( "a\\'b" ) ).toBe( '"a\\5C \\27 b"' );
	} );

	it( 'should replace null characters with U+FFFD', () => {
		expect( createCssString( 'a\0b' ) ).toBe( '"a\uFFFDb"' );
	} );

	it( 'should escape line feeds', () => {
		expect( createCssString( 'a\nb' ) ).toBe( '"a\\A b"' );
	} );

	it( 'should escape carriage returns', () => {
		expect( createCssString( 'a\rb' ) ).toBe( '"a\\A b"' );
	} );

	it( 'should escape CRLF as a single escape', () => {
		expect( createCssString( 'a\r\nb' ) ).toBe( '"a\\A b"' );
	} );

	it( 'should escape form feeds', () => {
		expect( createCssString( 'a\fb' ) ).toBe( '"a\\A b"' );
	} );

	it( 'should escape HTML-like characters < > &', () => {
		expect( createCssString( 'a<b>c&d' ) ).toBe(
			'"a\\3C b\\3E c\\26 d"'
		);
	} );

	it( 'should escape CSS syntax characters , ; { }', () => {
		expect( createCssString( 'a,b;c{d}' ) ).toBe(
			'"a\\2C b\\3B c\\7B d\\7D "'
		);
	} );

	it( 'should handle empty string', () => {
		expect( createCssString( '' ) ).toBe( '""' );
	} );

	it( 'should handle whitespace-only string', () => {
		expect( createCssString( '   ' ) ).toBe( '"   "' );
	} );

	it( 'should not escape spaces in names like "Exo 2"', () => {
		expect( createCssString( 'Exo 2' ) ).toBe( '"Exo 2"' );
	} );
} );
