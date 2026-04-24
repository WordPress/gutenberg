/**
 * Internal dependencies
 */
import { getFontStylesAndWeights } from '../get-font-styles-and-weights';

describe( 'getFontStylesAndWeights', () => {
	it( 'should return default styles and weights if fontFamilyFaces is not available', () => {
		expect( getFontStylesAndWeights() ).toEqual( {
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
				{
					name: 'Extra Black',
					value: '1000',
				},
			],
			combinedStyleAndWeightOptions: [
				{
					key: 'normal-100',
					name: 'Thin',
					style: {
						fontStyle: 'normal',
						fontWeight: '100',
					},
				},
				{
					key: 'normal-200',
					name: 'Extra Light',
					style: {
						fontStyle: 'normal',
						fontWeight: '200',
					},
				},
				{
					key: 'normal-300',
					name: 'Light',
					style: {
						fontStyle: 'normal',
						fontWeight: '300',
					},
				},
				{
					key: 'normal-400',
					name: 'Regular',
					style: {
						fontStyle: 'normal',
						fontWeight: '400',
					},
				},
				{
					key: 'normal-500',
					name: 'Medium',
					style: {
						fontStyle: 'normal',
						fontWeight: '500',
					},
				},
				{
					key: 'normal-600',
					name: 'Semi Bold',
					style: {
						fontStyle: 'normal',
						fontWeight: '600',
					},
				},
				{
					key: 'normal-700',
					name: 'Bold',
					style: {
						fontStyle: 'normal',
						fontWeight: '700',
					},
				},
				{
					key: 'normal-800',
					name: 'Extra Bold',
					style: {
						fontStyle: 'normal',
						fontWeight: '800',
					},
				},
				{
					key: 'normal-900',
					name: 'Black',
					style: {
						fontStyle: 'normal',
						fontWeight: '900',
					},
				},
				{
					key: 'normal-1000',
					name: 'Extra Black',
					style: {
						fontStyle: 'normal',
						fontWeight: '1000',
					},
				},
				{
					key: 'italic-100',
					name: 'Thin Italic',
					style: {
						fontStyle: 'italic',
						fontWeight: '100',
					},
				},
				{
					key: 'italic-200',
					name: 'Extra Light Italic',
					style: {
						fontStyle: 'italic',
						fontWeight: '200',
					},
				},
				{
					key: 'italic-300',
					name: 'Light Italic',
					style: {
						fontStyle: 'italic',
						fontWeight: '300',
					},
				},
				{
					key: 'italic-400',
					name: 'Regular Italic',
					style: {
						fontStyle: 'italic',
						fontWeight: '400',
					},
				},
				{
					key: 'italic-500',
					name: 'Medium Italic',
					style: {
						fontStyle: 'italic',
						fontWeight: '500',
					},
				},
				{
					key: 'italic-600',
					name: 'Semi Bold Italic',
					style: {
						fontStyle: 'italic',
						fontWeight: '600',
					},
				},
				{
					key: 'italic-700',
					name: 'Bold Italic',
					style: {
						fontStyle: 'italic',
						fontWeight: '700',
					},
				},
				{
					key: 'italic-800',
					name: 'Extra Bold Italic',
					style: {
						fontStyle: 'italic',
						fontWeight: '800',
					},
				},
				{
					key: 'italic-900',
					name: 'Black Italic',
					style: {
						fontStyle: 'italic',
						fontWeight: '900',
					},
				},
				{
					key: 'italic-1000',
					name: 'Extra Black Italic',
					style: {
						fontStyle: 'italic',
						fontWeight: '1000',
					},
				},
			],
			isSystemFont: true,
			isVariableFont: false,
		} );
	} );

	it( 'should return available styles and weights for a variable font', () => {
		const fontFamilyFaces = [
			{
				fontFamily: 'AR One Sans',
				fontStyle: 'normal',
				fontWeight: '400 700',
				src: 'http://www.wordpress.org/wp-content/uploads/fonts/AROneSans-VariableFont_ARRRwght.ttf',
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
			],
			combinedStyleAndWeightOptions: [
				{
					key: 'normal-400',
					name: 'Regular',
					style: {
						fontStyle: 'normal',
						fontWeight: '400',
					},
				},
				{
					key: 'normal-500',
					name: 'Medium',
					style: {
						fontStyle: 'normal',
						fontWeight: '500',
					},
				},
				{
					key: 'normal-600',
					name: 'Semi Bold',
					style: {
						fontStyle: 'normal',
						fontWeight: '600',
					},
				},
				{
					key: 'normal-700',
					name: 'Bold',
					style: {
						fontStyle: 'normal',
						fontWeight: '700',
					},
				},
				{
					key: 'italic-400',
					name: 'Regular Italic',
					style: {
						fontStyle: 'italic',
						fontWeight: '400',
					},
				},
				{
					key: 'italic-500',
					name: 'Medium Italic',
					style: {
						fontStyle: 'italic',
						fontWeight: '500',
					},
				},
				{
					key: 'italic-600',
					name: 'Semi Bold Italic',
					style: {
						fontStyle: 'italic',
						fontWeight: '600',
					},
				},
				{
					key: 'italic-700',
					name: 'Bold Italic',
					style: {
						fontStyle: 'italic',
						fontWeight: '700',
					},
				},
			],
			isSystemFont: false,
			isVariableFont: true,
		} );
	} );

	it( 'should return available styles and weights for a regular font', () => {
		const fontFamilyFaces = [
			{
				fontFamily: 'Piazzolla',
				fontStyle: 'normal',
				fontWeight: '400',
				src: 'http://www.wordpress.org/wp-content/uploads/fonts/N0b52SlTPu5rIkWIZjVKKtYtfxYqZ4RJBFzFfYUjkSDdlqZgy7LYxnL31AHfAAy5.woff2',
			},
			{
				fontFamily: 'Piazzolla',
				fontStyle: 'normal',
				fontWeight: 600,
				src: 'http://www.wordpress.org/wp-content/uploads/fonts/N0b52SlTPu5rIkWIZjVKKtYtfxYqZ4RJBFzFfYUjkSDdlqZgy7JxwXL31AHfAAy5.woff2',
			},
			{
				fontFamily: 'Piazzolla',
				fontStyle: 'normal',
				src: 'http://www.wordpress.org/wp-content/uploads/fonts/N0b52SlTPu5rIkWIZjVKKtYtfxYqZ4RJBFzFfYUjkSDdlqZgy7JxwXL31AHfAAy5.woff2',
			},
			{
				fontFamily: 'Piazzolla',
				fontStyle: 'normal',
				fontWeight: '900',
				src: 'http://www.wordpress.org/wp-content/uploads/fonts/N0b52SlTPu5rIkWIZjVKKtYtfxYqZ4RJBFzFfYUjkSDdlqZgy7JxwXL31AHfAAy5.woff2',
			},
			{
				fontFamily: 'Piazzolla',
				fontStyle: 'italic',
				fontWeight: '300',
				src: 'http://www.wordpress.org/wp-content/uploads/fonts/N0b72SlTPu5rIkWIZjVgI-TckS03oGpPETyEJ88Rbvi0_TzOzKcQhcSx3gD9BRy5m5M.woff2',
			},
			{
				fontFamily: 'Piazzolla',
				fontStyle: 'italic',
				fontWeight: '900',
				src: 'http://www.wordpress.org/wp-content/uploads/fonts/N0b72SlTPu5rIkWIZjVgI-TckS03oGpPETyEJ88Rbvi0_TzOzKcQhTO23gD9BRy5m5M.woff2',
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
					name: 'Regular',
					value: '400',
				},
				{
					name: 'Semi Bold',
					value: '600',
				},
				{
					name: 'Black',
					value: '900',
				},
				{
					name: 'Light',
					value: '300',
				},
			],
			combinedStyleAndWeightOptions: [
				{
					key: 'normal-400',
					name: 'Regular',
					style: {
						fontStyle: 'normal',
						fontWeight: '400',
					},
				},
				{
					key: 'normal-600',
					name: 'Semi Bold',
					style: {
						fontStyle: 'normal',
						fontWeight: '600',
					},
				},
				{
					key: 'normal-900',
					name: 'Black',
					style: {
						fontStyle: 'normal',
						fontWeight: '900',
					},
				},
				{
					key: 'normal-300',
					name: 'Light',
					style: {
						fontStyle: 'normal',
						fontWeight: '300',
					},
				},
				{
					key: 'italic-400',
					name: 'Regular Italic',
					style: {
						fontStyle: 'italic',
						fontWeight: '400',
					},
				},
				{
					key: 'italic-600',
					name: 'Semi Bold Italic',
					style: {
						fontStyle: 'italic',
						fontWeight: '600',
					},
				},
				{
					key: 'italic-900',
					name: 'Black Italic',
					style: {
						fontStyle: 'italic',
						fontWeight: '900',
					},
				},
				{
					key: 'italic-300',
					name: 'Light Italic',
					style: {
						fontStyle: 'italic',
						fontWeight: '300',
					},
				},
			],
			isSystemFont: false,
			isVariableFont: false,
		} );
	} );

	it( 'should return available styles and weights for a regular font with faux bold added', () => {
		const fontFamilyFaces = [
			{
				fontFamily: 'Piazzolla',
				fontStyle: 'normal',
				fontWeight: '400',
				src: 'http://www.wordpress.org/wp-content/uploads/fonts/N0b52SlTPu5rIkWIZjVKKtYtfxYqZ4RJBFzFfYUjkSDdlqZgy7LYxnL31AHfAAy5.woff2',
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
					name: 'Regular',
					value: '400',
				},
				{
					name: 'Bold',
					value: '700',
				},
			],
			combinedStyleAndWeightOptions: [
				{
					key: 'normal-400',
					name: 'Regular',
					style: {
						fontStyle: 'normal',
						fontWeight: '400',
					},
				},
				{
					key: 'normal-700',
					name: 'Bold',
					style: {
						fontStyle: 'normal',
						fontWeight: '700',
					},
				},
				{
					key: 'italic-400',
					name: 'Regular Italic',
					style: {
						fontStyle: 'italic',
						fontWeight: '400',
					},
				},
				{
					key: 'italic-700',
					name: 'Bold Italic',
					style: {
						fontStyle: 'italic',
						fontWeight: '700',
					},
				},
			],
			isSystemFont: false,
			isVariableFont: false,
		} );
	} );

	it( 'should return available styles and weights for a font without fontWeight', () => {
		const fontFamilyFaces = [
			{
				fontFamily: 'AR One Sans',
				fontStyle: 'normal',
				src: 'http://www.wordpress.org/wp-content/uploads/fonts/AROneSans-VariableFont_ARRRwght.ttf',
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
					name: 'Bold',
					value: '700',
				},
			],
			combinedStyleAndWeightOptions: [
				{
					key: 'normal-700',
					name: 'Bold',
					style: {
						fontStyle: 'normal',
						fontWeight: '700',
					},
				},
				{
					key: 'italic-700',
					name: 'Bold Italic',
					style: {
						fontStyle: 'italic',
						fontWeight: '700',
					},
				},
			],
			isSystemFont: false,
			isVariableFont: false,
		} );
	} );

	it( 'should return available styles and weights for a font with numeric fontWeight', () => {
		const fontFamilyFaces = [
			{
				fontFamily: 'AR One Sans',
				fontStyle: 'normal',
				fontWeight: 400,
				src: 'http://www.wordpress.org/wp-content/uploads/fonts/AROneSans-VariableFont_ARRRwght.ttf',
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
					name: 'Regular',
					value: '400',
				},
				{
					name: 'Bold',
					value: '700',
				},
			],
			combinedStyleAndWeightOptions: [
				{
					key: 'normal-400',
					name: 'Regular',
					style: {
						fontStyle: 'normal',
						fontWeight: '400',
					},
				},
				{
					key: 'normal-700',
					name: 'Bold',
					style: {
						fontStyle: 'normal',
						fontWeight: '700',
					},
				},
				{
					key: 'italic-400',
					name: 'Regular Italic',
					style: {
						fontStyle: 'italic',
						fontWeight: '400',
					},
				},
				{
					key: 'italic-700',
					name: 'Bold Italic',
					style: {
						fontStyle: 'italic',
						fontWeight: '700',
					},
				},
			],
			isSystemFont: false,
			isVariableFont: false,
		} );
	} );
} );
