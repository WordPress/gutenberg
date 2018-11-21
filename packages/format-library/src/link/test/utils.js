
/**
 * Internal dependencies
 */
import {
	isValidHref,
} from '../utils';

describe( 'isValidHref', () => {
	it( 'returns true if the href cannot be recognised as a url or an anchor link', () => {
		expect( isValidHref( 'notaurloranchorlink' ) ).toBe( true );
	} );

	it( 'returns false if the href is not specified', () => {
		expect( isValidHref() ).toBe( false );
		expect( isValidHref( '' ) ).toBe( false );
		expect( isValidHref( ' ' ) ).toBe( false );
	} );

	describe( 'URLs beginning with a protocol', () => {
		it( 'returns true for valid URLs', () => {
			expect( isValidHref( 'tel:+123456789' ) ).toBe( true );
			expect( isValidHref( 'mailto:test@somewhere.com' ) ).toBe( true );
			expect( isValidHref( 'file:///c:/WINDOWS/winamp.exe' ) ).toBe( true );
			expect( isValidHref( 'http://test.com' ) ).toBe( true );
			expect( isValidHref( 'https://test.com' ) ).toBe( true );
			expect( isValidHref( 'http://test-with-hyphen.com' ) ).toBe( true );
			expect( isValidHref( 'http://test.com/' ) ).toBe( true );
			expect( isValidHref( 'http://test.com#fragment' ) ).toBe( true );
			expect( isValidHref( 'http://test.com/path#fragment' ) ).toBe( true );
			expect( isValidHref( 'http://test.com/with/path/separators' ) ).toBe( true );
			expect( isValidHref( 'http://test.com/with?query=string&params' ) ).toBe( true );
		} );

		it( 'returns false for invalid urls', () => {
			expect( isValidHref( 'tel:+12 345 6789' ) ).toBe( false );
			expect( isValidHref( 'mailto:test @ somewhere.com' ) ).toBe( false );
			expect( isValidHref( 'mailto: test@somewhere.com' ) ).toBe( false );
			expect( isValidHref( 'ht#tp://this/is/invalid' ) ).toBe( false );
			expect( isValidHref( 'ht#tp://th&is/is/invalid' ) ).toBe( false );
			expect( isValidHref( 'http:/test.com' ) ).toBe( false );
			expect( isValidHref( 'http://?test.com' ) ).toBe( false );
			expect( isValidHref( 'http://#test.com' ) ).toBe( false );
			expect( isValidHref( 'http://test.com?double?params' ) ).toBe( false );
			expect( isValidHref( 'http://test.com#double#anchor' ) ).toBe( false );
			expect( isValidHref( 'http://test.com?path/after/params' ) ).toBe( false );
			expect( isValidHref( 'http://test.com#path/after/fragment' ) ).toBe( false );
		} );

		it( 'returns false if the URL has whitespace', () => {
			expect( isValidHref( 'http:/ /test.com' ) ).toBe( false );
			expect( isValidHref( 'http://te st.com' ) ).toBe( false );
			expect( isValidHref( 'http:// test.com' ) ).toBe( false );
			expect( isValidHref( 'http://test.c om' ) ).toBe( false );
			expect( isValidHref( 'http://test.com/ee ee/' ) ).toBe( false );
			expect( isValidHref( 'http://test.com/eeee?qwd qwdw' ) ).toBe( false );
			expect( isValidHref( 'http://test.com/eeee#qwd qwdw' ) ).toBe( false );
		} );
	} );

	describe( 'Anchor links', () => {
		it( 'returns true for valid anchor links', () => {
			expect( isValidHref( '#yesitis' ) ).toBe( true );
			expect( isValidHref( '#yes_it_is' ) ).toBe( true );
			expect( isValidHref( '#yes~it~is' ) ).toBe( true );
			expect( isValidHref( '#yes-it-is' ) ).toBe( true );
		} );

		it( 'returns false for invalid anchor links', () => {
			expect( isValidHref( '' ) ).toBe( false );
			expect( isValidHref( '#no-it-isnt#' ) ).toBe( false );
			expect( isValidHref( '#no-it-#isnt' ) ).toBe( false );
			expect( isValidHref( '#no-it-isnt?' ) ).toBe( false );
			expect( isValidHref( '#no-it isnt' ) ).toBe( false );
			expect( isValidHref( '#no-it-isnt/' ) ).toBe( false );
		} );
	} );
} );

