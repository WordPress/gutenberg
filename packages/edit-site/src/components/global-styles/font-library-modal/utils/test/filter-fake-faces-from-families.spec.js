/**
 * Internal dependencies
 */
import { filterFakeFacesFromFamilies } from '../filter-fonts';

describe( 'filterFakeFacesFromFamilies', () => {
	it( 'should not alter font without any fake faces', () => {
		const fonts = [
			{
				fontFace: [
					{ fontStyle: 'normal', fontWeight: '400' },
					{ fontStyle: 'italic', fontWeight: '400' },
				],
				fontFamily: 'Arial',
			},
		];

		const result = filterFakeFacesFromFamilies( fonts );

		expect( result ).toEqual( fonts );
	} );

	it( 'should remove faces marked as fake', () => {
		const fonts = [
			{
				fontFace: [
					{ fontStyle: 'normal', fontWeight: '400', fake: true },
					{ fontStyle: 'italic', fontWeight: '400' },
				],
				fontFamily: 'Arial',
			},
		];

		const expectedOutput = [
			{
				fontFace: [ { fontStyle: 'italic', fontWeight: '400' } ],
				fontFamily: 'Arial',
			},
		];

		const result = filterFakeFacesFromFamilies( fonts );

		expect( result ).toEqual( expectedOutput );
	} );

	it( 'should remove fontFace key for font with only fake faces', () => {
		const fonts = [
			{
				fontFace: [
					{ fontStyle: 'normal', fontWeight: '400', fake: true },
					{ fontStyle: 'italic', fontWeight: '400', fake: true },
				],
				fontFamily: 'Arial',
			},
		];

		const expectedOutput = [
			{
				fontFamily: 'Arial',
			},
		];

		const result = filterFakeFacesFromFamilies( fonts );

		expect( result ).toEqual( expectedOutput );
	} );

	it( 'should return an empty array for an empty input', () => {
		const fonts = [];

		const result = filterFakeFacesFromFamilies( fonts );

		expect( result ).toEqual( [] );
	} );
} );
