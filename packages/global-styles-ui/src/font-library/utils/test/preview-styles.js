import { describe, expect, it } from 'vitest';
import {
	formatFontFamily,
	getFacePreviewStyle,
	getFamilyPreviewStyle,
} from '../preview-styles';

describe( 'getFacePreviewStyle', () => {
	it.each( [
		[ '700', '700' ],
		[ '200 900', '400' ],
		[ '500 900', '500' ],
		[ '100 300', '300' ],
		[ 'bold', '700' ],
		[ '500 bold', '500' ],
		[ 'auto', '400' ],
		[ undefined, '400' ],
	] )( 'resolves %p to %p', ( fontWeight, expected ) => {
		expect(
			getFacePreviewStyle( { fontFamily: 'Inter', fontWeight } )
		).toEqual( expect.objectContaining( { fontWeight: expected } ) );
	} );
} );

describe( 'getFamilyPreviewStyle', () => {
	it( 'resolves the range of the normal faces', () => {
		expect(
			getFamilyPreviewStyle( {
				fontFamily: 'Inter',
				fontFace: [ { fontStyle: 'normal', fontWeight: '150 700' } ],
			} )
		).toEqual( expect.objectContaining( { fontWeight: '400' } ) );
	} );

	it( 'picks the weight closest to regular across the normal faces', () => {
		expect(
			getFamilyPreviewStyle( {
				fontFamily: 'Inter',
				fontFace: [
					{ fontStyle: 'normal', fontWeight: '700' },
					{ fontStyle: 'normal', fontWeight: '500' },
				],
			} )
		).toEqual( expect.objectContaining( { fontWeight: '500' } ) );
	} );

	it( 'falls back to the first face when none are normal', () => {
		expect(
			getFamilyPreviewStyle( {
				fontFamily: 'Inter',
				fontFace: [ { fontStyle: 'italic', fontWeight: '200 900' } ],
			} )
		).toEqual(
			expect.objectContaining( {
				fontStyle: 'italic',
				fontWeight: '400',
			} )
		);
	} );
} );

describe( 'formatFontFamily', () => {
	it.each( [
		// A reference to a custom property is a CSS function call, so it is
		// left as it is rather than quoted like a font name.
		[
			'var(--wp--preset--font-family--body)',
			'var(--wp--preset--font-family--body)',
		],
		[ 'var(--my-font), sans-serif', 'var(--my-font), sans-serif' ],
		[ 'Open Sans, var(--my-font)', '"Open Sans", var(--my-font)' ],
		// CSS allows whitespace inside the parentheses.
		[ 'var( --my-font )', 'var( --my-font )' ],
		// Not a custom property: a `var()` reference has to start with `--`.
		[ 'var(myfont)', '"var(myfont)"' ],
		// Names and keywords are unaffected.
		[
			'Open Sans, Font+Name, sans-serif',
			'"Open Sans", "Font+Name", sans-serif',
		],
		[ 'sans-serif', 'sans-serif' ],
		[ 'generic(kai), sans-serif', 'generic(kai), sans-serif' ],
		[
			"'Open Sans', generic(kai), sans-serif",
			'"Open Sans", generic(kai), sans-serif',
		],
		[
			'DotGothic16, Slabo 27px, serif',
			'"DotGothic16", "Slabo 27px", serif',
		],
		[ "Mine's, Moe's Typography", '"Mine\'s", "Moe\'s Typography"' ],
	] )( 'formats %p as %p', ( input, expected ) => {
		expect( formatFontFamily( input ) ).toBe( expected );
	} );
} );
