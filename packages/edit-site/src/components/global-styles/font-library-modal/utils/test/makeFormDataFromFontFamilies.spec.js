/**
 * Internal dependencies
 */
import { makeFormDataFromFontFamilies } from '../index';

/* global File */

describe( 'makeFormDataFromFontFamilies', () => {
	it( 'should process fontFamilies and return FormData', () => {
		const mockFontFamilies = [
			{
				slug: 'bebas',
				name: 'Bebas',
				fontFamily: 'Bebas',
				fontFace: [
					{
						file: new File( [ 'content' ], 'test-font1.woff2' ),
						fontWeight: '500',
						fontStyle: 'normal',
					},
					{
						file: new File( [ 'content' ], 'test-font2.woff2' ),
						fontWeight: '400',
						fontStyle: 'normal',
					},
				],
			},
		];

		const formData = makeFormDataFromFontFamilies( mockFontFamilies );

		expect( formData instanceof FormData ).toBeTruthy();

		// Check if files are added correctly
		expect( formData.get( 'file-0-0' ).name ).toBe( 'test-font1.woff2' );
		expect( formData.get( 'file-0-1' ).name ).toBe( 'test-font2.woff2' );

		// Check if 'fontFamilies' key in FormData is correct
		const expectedFontFamilies = [
			{
				fontFace: [
					{
						fontWeight: '500',
						fontStyle: 'normal',
						uploadedFile: 'file-0-0',
					},
					{
						fontWeight: '400',
						fontStyle: 'normal',
						uploadedFile: 'file-0-1',
					},
				],
				slug: 'bebas',
				name: 'Bebas',
				fontFamily: 'Bebas',
			},
		];
		expect( JSON.parse( formData.get( 'font_families' ) ) ).toEqual(
			expectedFontFamilies
		);
	} );
} );
