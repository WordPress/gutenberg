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
		expect( formData.get( 'files0' ).name ).toBe( 'test-font1.woff2' );
		expect( formData.get( 'files1' ).name ).toBe( 'test-font2.woff2' );

		// Check if 'fontFamilies' key in FormData is correct
		const expectedFontFamilies = [
			{
				fontFace: [
					{ fontWeight: '500', fontStyle: 'normal' },
					{ fontWeight: '400', fontStyle: 'normal' },
				],
				slug: 'bebas',
				name: 'Bebas',
				fontFamily: 'Bebas',
			},
		];
		expect( JSON.parse( formData.get( 'fontFamilies' ) ) ).toEqual(
			expectedFontFamilies
		);
	} );
} );
