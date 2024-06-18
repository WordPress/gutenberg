/**
 * Internal dependencies
 */
import {
	getFamilyPreviewStyle,
	formatFontFamily,
	formatFontFaceName,
} from '../preview-styles';

describe( 'getFamilyPreviewStyle', () => {
	it( 'should return default fontStyle and fontWeight if fontFace is not provided', () => {
		const family = { fontFamily: 'Rosario' };
		const result = getFamilyPreviewStyle( family );
		const expected = {
			fontFamily: 'Rosario',
			fontWeight: '400',
			fontStyle: 'normal',
		};
		expect( result ).toEqual( expected );
	} );

	it( 'should return fontStyle as "normal" if fontFace contains "normal" style', () => {
		const family = {
			fontFamily: 'Rosario',
			fontFace: [
				{ fontStyle: 'italic', fontWeight: '500' },
				{ fontStyle: 'normal', fontWeight: '600' },
			],
		};
		const result = getFamilyPreviewStyle( family );
		const expected = {
			fontFamily: 'Rosario',
			fontStyle: 'normal',
			fontWeight: '600',
		};
		expect( result ).toEqual( expected );
	} );

	it( 'should return fontStyle as "itaic" if fontFace does not contain "normal" style', () => {
		const family = {
			fontFamily: 'Rosario',
			fontFace: [
				{ fontStyle: 'italic', fontWeight: '500' },
				{ fontStyle: 'italic', fontWeight: '600' },
			],
		};
		const result = getFamilyPreviewStyle( family );
		const expected = {
			fontFamily: 'Rosario',
			fontStyle: 'italic',
			fontWeight: '500',
		};
		expect( result ).toEqual( expected );
	} );

	it( 'should return fontWeight as string', () => {
		const family = {
			fontFamily: 'Rosario',
			fontFace: [
				{ fontStyle: 'italic', fontWeight: '500' },
				{ fontStyle: 'normal', fontWeight: '700' },
			],
		};
		const result = getFamilyPreviewStyle( family );
		const expected = {
			fontFamily: 'Rosario',
			fontStyle: 'normal',
			fontWeight: '700',
		};
		expect( result ).toEqual( expected );
	} );

	it( 'should return fontWeight as "400" if fontFace contains "normal" style with "400" weight', () => {
		const family = {
			fontFamily: 'Rosario',
			fontFace: [
				{ fontStyle: 'italic', fontWeight: '500' },
				{ fontStyle: 'normal', fontWeight: '400' },
			],
		};
		const result = getFamilyPreviewStyle( family );
		const expected = {
			fontFamily: 'Rosario',
			fontStyle: 'normal',
			fontWeight: '400',
		};
		expect( result ).toEqual( expected );
	} );

	it( 'should return the fontWeight of the nearest "normal" style if no "400" weight is found', () => {
		const family = {
			fontFamily: 'Rosario',
			fontFace: [
				{ fontStyle: 'normal', fontWeight: '800' },
				{ fontStyle: 'italic', fontWeight: '500' },
				{ fontStyle: 'normal', fontWeight: '600' },
			],
		};
		const result = getFamilyPreviewStyle( family );
		const expected = {
			fontFamily: 'Rosario',
			fontStyle: 'normal',
			fontWeight: '600',
		};
		expect( result ).toEqual( expected );
	} );

	it( 'should return 400 or the the nearest "normal" style if it using a variable weight font', () => {
		const family = {
			fontFamily: 'Rosario',
			fontFace: [
				{ fontStyle: 'normal', fontWeight: '100' },
				{ fontStyle: 'normal', fontWeight: '200 900' },
				{ fontStyle: 'italic', fontWeight: '200 900' },
			],
		};
		const result = getFamilyPreviewStyle( family );
		const expected = {
			fontFamily: 'Rosario',
			fontStyle: 'normal',
			fontWeight: '400',
		};
		expect( result ).toEqual( expected );
	} );
} );

describe( 'formatFontFamily', () => {
	it( 'should transform "Baloo 2, system-ui" correctly', () => {
		expect( formatFontFamily( 'Baloo 2, system-ui' ) ).toBe(
			'"Baloo 2", system-ui'
		);
	} );

	it( 'should ignore extra spaces', () => {
		expect( formatFontFamily( '  Baloo 2   , system-ui' ) ).toBe(
			'"Baloo 2", system-ui'
		);
	} );

	it( 'should keep quoted strings unchanged', () => {
		expect(
			formatFontFamily(
				"Seravek, 'Gill Sans Nova', Ubuntu, Calibri, 'DejaVu Sans', source-sans-pro, sans-serif"
			)
		).toBe(
			'Seravek, "Gill Sans Nova", Ubuntu, Calibri, "DejaVu Sans", source-sans-pro, sans-serif'
		);
	} );

	it( 'should wrap single font name with spaces in quotes', () => {
		expect( formatFontFamily( 'Baloo 2' ) ).toBe( '"Baloo 2"' );
	} );

	it( 'should wrap multiple font names with spaces in quotes', () => {
		expect( formatFontFamily( 'Baloo Bhai 2, Baloo 2' ) ).toBe(
			'"Baloo Bhai 2", "Baloo 2"'
		);
	} );

	it( 'should wrap names with special characters in quotes', () => {
		expect(
			formatFontFamily(
				'Font+Name, Font*Name, _Font_Name_, generic(kai), sans-serif'
			)
		).toBe(
			'"Font+Name", "Font*Name", "_Font_Name_", generic(kai), sans-serif'
		);
	} );

	it( 'should fix empty wrong formatted font family', () => {
		expect( formatFontFamily( ', Abril Fatface,Times,serif' ) ).toBe(
			'"Abril Fatface", Times, serif'
		);
	} );

	it( 'should not add quotes to generic names', () => {
		expect(
			formatFontFamily(
				'Paren(thesis)Font, generic(kai), generic(fasongsong), generic( abc ), Helvetica Neue'
			)
		).toBe(
			'"Paren(thesis)Font", generic(kai), generic(fasongsong), generic( abc ), "Helvetica Neue"'
		);
	} );
} );

describe( 'formatFontFaceName', () => {
	it( 'should remove leading and trailing quotes', () => {
		expect( formatFontFaceName( '"Open Sans"' ) ).toBe( 'Open Sans' );
	} );

	it( 'should remove leading and trailing quotes from multiple font face names', () => {
		expect(
			formatFontFaceName( "'Open Sans', 'Helvetica Neue', sans-serif" )
		).toBe( 'Open Sans' );
	} );

	it( 'should remove leading and trailing quotes even from names with spaces and special characters', () => {
		expect( formatFontFaceName( "'Font+Name 24', sans-serif" ) ).toBe(
			'Font+Name 24'
		);
	} );

	it( 'should ouput the font face name with quotes on Firefox', () => {
		const mockUserAgent =
			'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:122.0) Gecko/20100101 Firefox/122.0';

		// Mock the userAgent for this test
		Object.defineProperty( window.navigator, 'userAgent', {
			value: mockUserAgent,
			configurable: true,
		} );

		expect( formatFontFaceName( 'Open Sans' ) ).toBe( '"Open Sans"' );
	} );
} );
