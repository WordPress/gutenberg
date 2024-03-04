/**
 * Internal dependencies
 */
import { getFontsOutline, isFontFontFaceInOutline } from '../fonts-outline';

describe( 'getFontsOutline', () => {
	test( 'should return an empty object for an empty fonts array', () => {
		const fonts = [];
		const result = getFontsOutline( fonts );
		expect( result ).toEqual( {} );
	} );

	test( 'should handle fonts with no fontFace property', () => {
		const fonts = [
			{ slug: 'font1' },
			{
				slug: 'font2',
				fontFace: [ { fontStyle: 'normal', fontWeight: '400' } ],
			},
		];
		const result = getFontsOutline( fonts );
		expect( result ).toEqual( {
			font1: {},
			font2: { 'normal-400': true },
		} );
	} );

	test( 'should handle fonts with an empty fontFace array', () => {
		const fonts = [ { slug: 'font1', fontFace: [] } ];
		const result = getFontsOutline( fonts );
		expect( result ).toEqual( {
			font1: {},
		} );
	} );

	test( 'should handle fonts with multiple font faces', () => {
		const fonts = [
			{
				slug: 'font1',
				fontFace: [
					{ fontStyle: 'normal', fontWeight: '400' },
					{ fontStyle: 'italic', fontWeight: '700' },
				],
			},
		];
		const result = getFontsOutline( fonts );
		expect( result ).toEqual( {
			font1: {
				'normal-400': true,
				'italic-700': true,
			},
		} );
	} );
} );

describe( 'isFontFontFaceInOutline', () => {
	test( 'should return false for an empty outline', () => {
		const slug = 'font1';
		const face = { fontStyle: 'normal', fontWeight: '400' };
		const outline = {};

		const result = isFontFontFaceInOutline( slug, face, outline );

		expect( result ).toBe( false );
	} );

	test( 'should return false when outline has the slug but no matching fontStyle-fontWeight', () => {
		const slug = 'font1';
		const face = { fontStyle: 'normal', fontWeight: '400' };
		const outline = {
			font1: {
				'italic-700': true,
			},
		};

		const result = isFontFontFaceInOutline( slug, face, outline );

		expect( result ).toBe( false );
	} );

	test( 'should return false when outline does not have the slug', () => {
		const slug = 'font1';
		const face = { fontStyle: 'normal', fontWeight: '400' };
		const outline = {
			font2: {
				'normal-400': true,
			},
		};

		const result = isFontFontFaceInOutline( slug, face, outline );

		expect( result ).toBe( false );
	} );

	test( 'should return true when outline has the slug and the matching fontStyle-fontWeight', () => {
		const slug = 'font1';
		const face = { fontStyle: 'normal', fontWeight: '400' };
		const outline = {
			font1: {
				'normal-400': true,
				'italic-700': true,
			},
		};

		const result = isFontFontFaceInOutline( slug, face, outline );

		expect( result ).toBe( true );
	} );
} );
