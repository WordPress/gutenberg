/**
 * Internal dependencies
 */
import { getFontStylesAndWeights } from '../get-font-styles-and-weights';

describe( 'getFontStylesAndWeights', () => {
	it( 'should return empty object if fontFamilyFaces is not available', () => {
		expect( getFontStylesAndWeights() ).toEqual( {} );
	} );

	it( 'should return correct font styles and weights based on available options', () => {
		const fontFamilyFaces = [
			{
				fontFamily: 'ABeeZee',
				fontStyle: 'italic',
				fontWeight: '400',
				src: 'http://www.wordpress.org/wp-content/uploads/fonts/esDT31xSG-6AGleN2tCkkJUCGpG-GQ.woff2',
			},
		];
		expect( getFontStylesAndWeights( fontFamilyFaces ) ).toEqual( {
			fontStyles: [
				{
					name: 'Italic',
					value: 'italic',
				},
			],
			fontWeights: [
				{
					name: 'Regular',
					value: '400',
				},
			],
		} );
	} );

	it( 'should return all available style and weight options if font weights string includes a space', () => {
		const fontFamilyFaces = [
			{
				fontFamily: 'Inter',
				fontStyle: 'normal',
				fontWeight: '100 900',
				src: 'http://www.wordpress.org/wp-content/uploads/fonts/Inter-VariableFont_slntwght.ttf',
			},
		];

		expect( getFontStylesAndWeights( fontFamilyFaces ) ).toEqual( {
			fontStyles: [
				{
					name: 'Regular',
					value: 'normal',
				},
				{
					name: 'Italic',
					value: 'italic',
				},
			],
			fontWeights: [
				{
					name: 'Thin',
					value: '100',
				},
				{
					name: 'Extra Light',
					value: '200',
				},
				{
					name: 'Light',
					value: '300',
				},
				{
					name: 'Regular',
					value: '400',
				},
				{
					name: 'Medium',
					value: '500',
				},
				{
					name: 'Semi Bold',
					value: '600',
				},
				{
					name: 'Bold',
					value: '700',
				},
				{
					name: 'Extra Bold',
					value: '800',
				},
				{
					name: 'Black',
					value: '900',
				},
			],
		} );
	} );
} );
