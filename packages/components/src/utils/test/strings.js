/**
 * Internal dependencies
 */
import { kebabCase, normalizeTextString } from '../strings';

describe( 'kebabCase', () => {
	it( 'separates lowercase letters, followed by uppercase letters', () => {
		expect( kebabCase( 'fooBar' ) ).toEqual( 'foo-bar' );
	} );

	it( 'separates numbers, followed by uppercase letters', () => {
		expect( kebabCase( '123FOO' ) ).toEqual( '123-foo' );
	} );

	it( 'separates numbers, followed by lowercase characters', () => {
		expect( kebabCase( '123bar' ) ).toEqual( '123-bar' );
	} );

	it( 'separates uppercase letters, followed by numbers', () => {
		expect( kebabCase( 'FOO123' ) ).toEqual( 'foo-123' );
	} );

	it( 'separates lowercase letters, followed by numbers', () => {
		expect( kebabCase( 'foo123' ) ).toEqual( 'foo-123' );
	} );

	it( 'separates uppercase groups from capitalized groups', () => {
		expect( kebabCase( 'FOOBar' ) ).toEqual( 'foo-bar' );
	} );

	it( 'removes any non-dash special characters', () => {
		expect(
			kebabCase( 'foo±§!@#$%^&*()-_=+/?.>,<\\|{}[]`~\'";:bar' )
		).toEqual( 'foo-bar' );
	} );

	it( 'removes any spacing characters', () => {
		expect( kebabCase( ' foo \t \n \r \f \v bar ' ) ).toEqual( 'foo-bar' );
	} );

	it( 'groups multiple dashes into a single one', () => {
		expect( kebabCase( 'foo---bar' ) ).toEqual( 'foo-bar' );
	} );

	it( 'returns an empty string unchanged', () => {
		expect( kebabCase( '' ) ).toEqual( '' );
	} );

	it( 'returns an existing kebab case string unchanged', () => {
		expect( kebabCase( 'foo-123-bar' ) ).toEqual( 'foo-123-bar' );
	} );

	it( 'returns an empty string if any nullish type is passed', () => {
		expect( kebabCase( undefined ) ).toEqual( '' );
		expect( kebabCase( null ) ).toEqual( '' );
	} );

	it( 'converts any unexpected non-nullish type to a string', () => {
		expect( kebabCase( 12345 ) ).toEqual( '12345' );
		expect( kebabCase( [] ) ).toEqual( '' );
		expect( kebabCase( {} ) ).toEqual( 'object-object' );
	} );

	/**
	 * Should cover all test cases of `_wp_to_kebab_case()`.
	 *
	 * @see https://developer.wordpress.org/reference/functions/_wp_to_kebab_case/
	 * @see https://github.com/WordPress/wordpress-develop/blob/76376fdbc3dc0b3261de377dffc350677345e7ba/tests/phpunit/tests/functions/wpToKebabCase.php#L35-L62
	 */
	it.each( [
		[ 'white', 'white' ],
		[ 'white+black', 'white-black' ],
		[ 'white:black', 'white-black' ],
		[ 'white*black', 'white-black' ],
		[ 'white.black', 'white-black' ],
		[ 'white black', 'white-black' ],
		[ 'white	black', 'white-black' ],
		[ 'white-to-black', 'white-to-black' ],
		[ 'white2white', 'white-2-white' ],
		[ 'white2nd', 'white-2nd' ],
		[ 'white2ndcolor', 'white-2-ndcolor' ],
		[ 'white2ndColor', 'white-2nd-color' ],
		[ 'white2nd_color', 'white-2nd-color' ],
		[ 'white23color', 'white-23-color' ],
		[ 'white23', 'white-23' ],
		[ '23color', '23-color' ],
		[ 'white4th', 'white-4th' ],
		[ 'font2xl', 'font-2-xl' ],
		[ 'whiteToWhite', 'white-to-white' ],
		[ 'whiteTOwhite', 'white-t-owhite' ],
		[ 'WHITEtoWHITE', 'whit-eto-white' ],
		[ 42, '42' ],
		[ "i've done", 'ive-done' ],
		[ '#ffffff', 'ffffff' ],
		[ '$ffffff', 'ffffff' ],
	] )( 'converts %s properly to %s', ( input, expected ) => {
		expect( kebabCase( input ) ).toEqual( expected );
	} );
} );

describe( 'normalizeTextString', () => {
	it( 'should normalize hyphen-like characters to hyphens', () => {
		expect( normalizeTextString( 'foo~bar' ) ).toBe( 'foo-bar' );
		expect( normalizeTextString( 'foo־bar' ) ).toBe( 'foo-bar' );
		expect( normalizeTextString( 'foo‐bar' ) ).toBe( 'foo-bar' );
		expect( normalizeTextString( 'foo⸻bar' ) ).toBe( 'foo-bar' );
		expect( normalizeTextString( 'foo゠bar' ) ).toBe( 'foo-bar' );
		expect( normalizeTextString( 'foo－bar' ) ).toBe( 'foo-bar' );

		const dashCharacters = [
			// - (hyphen-minus)
			'\u002d',
			// ~ (tilde)
			'\u007e',
			// ­ (soft hyphen)
			'\u00ad',
			// ֊ (armenian hyphen)
			'\u058a',
			// ־ (hebrew punctuation maqaf)
			'\u05be',
			// ᐀ (canadian syllabics hyphen)
			'\u1400',
			// ᠆ (mongolian todo soft hyphen)
			'\u1806',
			// ‐ (hyphen)
			'\u2010',
			// non-breaking hyphen)
			'\u2011',
			// ‒ (figure dash)
			'\u2012',
			// – (en dash)
			'\u2013',
			// — (em dash)
			'\u2014',
			// ― (horizontal bar)
			'\u2015',
			// ⁓ (swung dash)
			'\u2053',
			// ⁻ (superscript minus)
			'\u207b',
			// ₋ (subscript minus)
			'\u208b',
			// − (minus sign)
			'\u2212',
			// ⸗ (double oblique hyphen)
			'\u2e17',
			// ⸺ (two-em dash)
			'\u2e3a',
			// ⸻ (three-em dash)
			'\u2e3b',
			// 〜 (wave dash)
			'\u301c',
			// 〰 (wavy dash)
			'\u3030',
			// ゠ (katakana-hiragana double hyphen)
			'\u30a0',
			// ︱ (presentation form for vertical em dash)
			'\ufe31',
			// ︲ (presentation form for vertical en dash)
			'\ufe32',
			// ﹘ (small em dash)
			'\ufe58',
			// ﹣ (small hyphen-minus)
			'\ufe63',
			// － (fullwidth hyphen-minus)
			'\uff0d',
		];
		expect( normalizeTextString( dashCharacters.join( '' ) ) ).toBe(
			'-'.repeat( dashCharacters.length )
		);
	} );
} );
