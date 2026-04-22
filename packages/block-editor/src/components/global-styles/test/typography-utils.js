/**
 * Internal dependencies
 */
import {
	getMergedFontFamiliesAndFontFamilyFaces,
	findNearestFontWeight,
	findNearestFontStyle,
	findNearestStyleAndWeight,
} from '../typography-utils';

describe( 'typography utils', () => {
	describe( 'getMergedFontFamiliesAndFontFamilyFaces', () => {
		[
			{
				message:
					'should return empty arrays when settings and fontFamily are empty',
				settings: {},
				fontFamily: '',
				expected: {
					fontFamilies: [],
					fontFamilyFaces: [],
				},
			},

			{
				message:
					'should return empty arrays when only settings is `undefined`',
				settings: undefined,
				fontFamily: 'ABeeZee, sans-serif',
				expected: {
					fontFamilies: [],
					fontFamilyFaces: [],
				},
			},

			{
				message:
					'should return fontFamilies array and an empty fontFamilyFaces array when fontfamily is empty',
				settings: {
					typography: {
						fontFamilies: {
							custom: [
								{
									name: 'ABeeZee',
									slug: 'abeezee',
									fontFamily: 'ABeeZee, sans-serif',
									fontFace: [
										{
											src: 'http://www.wordpress.org/wp-content/uploads/fonts/esDT31xSG-6AGleN2tCkkJUCGpG-GQ.woff2',
											fontWeight: '400',
											fontStyle: 'italic',
											fontFamily: 'ABeeZee',
										},
									],
								},
							],
						},
					},
				},
				fontFamily: '',
				expected: {
					fontFamilies: [
						{
							fontFace: [
								{
									fontFamily: 'ABeeZee',
									fontStyle: 'italic',
									fontWeight: '400',
									src: 'http://www.wordpress.org/wp-content/uploads/fonts/esDT31xSG-6AGleN2tCkkJUCGpG-GQ.woff2',
								},
							],
							fontFamily: 'ABeeZee, sans-serif',
							name: 'ABeeZee',
							slug: 'abeezee',
						},
					],
					fontFamilyFaces: [],
				},
			},

			{
				message:
					'should return font families and font faces when both settings and fontFamily are defined',
				settings: {
					typography: {
						fontFamilies: {
							theme: [
								{
									fontFace: [
										{
											fontFamily: 'PT Sans',
											fontStyle: 'normal',
											fontWeight: '400',
											src: [
												'file:./assets/fonts/pt-sans_normal_400.ttf',
											],
										},
										{
											fontFamily: 'PT Sans',
											fontStyle: 'normal',
											fontWeight: '700',
											src: [
												'file:./assets/fonts/pt-sans_normal_700.ttf',
											],
										},
										{
											fontFamily: 'PT Sans',
											fontStyle: 'italic',
											fontWeight: '400',
											src: [
												'file:./assets/fonts/pt-sans_italic_400.ttf',
											],
										},
										{
											fontFamily: 'PT Sans',
											fontStyle: 'italic',
											fontWeight: '700',
											src: [
												'file:./assets/fonts/pt-sans_italic_700.ttf',
											],
										},
									],
									fontFamily: 'PT Sans',
									name: 'PT Sans',
									slug: 'pt-sans',
								},
							],
							custom: [
								{
									name: 'ABeeZee',
									slug: 'abeezee',
									fontFamily: 'ABeeZee, sans-serif',
									fontFace: [
										{
											src: 'http://www.wordpress.org/wp-content/uploads/fonts/esDT31xSG-6AGleN2tCkkJUCGpG-GQ.woff2',
											fontWeight: '400',
											fontStyle: 'italic',
											fontFamily: 'ABeeZee',
										},
									],
								},
							],
						},
					},
				},
				fontFamily: 'ABeeZee, sans-serif',
				expected: {
					fontFamilyFaces: [
						{
							fontFamily: 'ABeeZee',
							fontStyle: 'italic',
							fontWeight: '400',
							src: 'http://www.wordpress.org/wp-content/uploads/fonts/esDT31xSG-6AGleN2tCkkJUCGpG-GQ.woff2',
						},
					],
					fontFamilies: [
						{
							fontFace: [
								{
									fontFamily: 'PT Sans',
									fontStyle: 'normal',
									fontWeight: '400',
									src: [
										'file:./assets/fonts/pt-sans_normal_400.ttf',
									],
								},
								{
									fontFamily: 'PT Sans',
									fontStyle: 'normal',
									fontWeight: '700',
									src: [
										'file:./assets/fonts/pt-sans_normal_700.ttf',
									],
								},
								{
									fontFamily: 'PT Sans',
									fontStyle: 'italic',
									fontWeight: '400',
									src: [
										'file:./assets/fonts/pt-sans_italic_400.ttf',
									],
								},
								{
									fontFamily: 'PT Sans',
									fontStyle: 'italic',
									fontWeight: '700',
									src: [
										'file:./assets/fonts/pt-sans_italic_700.ttf',
									],
								},
							],
							fontFamily: 'PT Sans',
							name: 'PT Sans',
							slug: 'pt-sans',
						},
						{
							fontFace: [
								{
									fontFamily: 'ABeeZee',
									fontStyle: 'italic',
									fontWeight: '400',
									src: 'http://www.wordpress.org/wp-content/uploads/fonts/esDT31xSG-6AGleN2tCkkJUCGpG-GQ.woff2',
								},
							],
							fontFamily: 'ABeeZee, sans-serif',
							name: 'ABeeZee',
							slug: 'abeezee',
						},
					],
				},
			},
		].forEach( ( { message, settings, fontFamily, expected } ) => {
			it( `${ message }`, () => {
				expect(
					getMergedFontFamiliesAndFontFamilyFaces(
						settings,
						fontFamily
					)
				).toEqual( expected );
			} );
		} );
	} );

	describe( 'findNearestFontWeight', () => {
		[
			{
				message:
					'should return empty string when newFontWeightValue is `undefined`',
				availableFontWeights: undefined,
				newFontWeightValue: undefined,
				expected: '',
			},
			{
				message:
					'should return newFontWeightValue value when availableFontWeights is empty',
				availableFontWeights: [],
				newFontWeightValue: '300',
				expected: '300',
			},
			{
				message: 'should return correct nearest higher font weight',
				availableFontWeights: [
					{ name: 'Regular', value: '400' },
					{ name: 'Bold', value: '700' },
					{ name: 'Black', value: '900' },
				],
				newFontWeightValue: '300',
				expected: '400',
			},
			{
				message: 'should return correct nearest lower font weight',
				availableFontWeights: [
					{ name: 'Thin', value: '100' },
					{ name: 'Light', value: '300' },
					{ name: 'Regular', value: '400' },
				],
				newFontWeightValue: '900',
				expected: '400',
			},
		].forEach(
			( {
				message,
				availableFontWeights,
				newFontWeightValue,
				expected,
			} ) => {
				it( `${ message }`, () => {
					expect(
						findNearestFontWeight(
							availableFontWeights,
							newFontWeightValue
						)
					).toEqual( expected );
				} );
			}
		);
	} );

	describe( 'findNearestFontStyle', () => {
		[
			{
				message:
					'should return empty string when newFontStyleValue is `undefined`',
				availableFontStyles: undefined,
				newFontStyleValue: undefined,
				expected: '',
			},
			{
				message:
					'should return newFontStyleValue value when availableFontStyles is empty',
				availableFontStyles: [],
				newFontStyleValue: 'italic',
				expected: 'italic',
			},
			{
				message:
					'should return empty string if there is no new font style available',
				availableFontStyles: [ { name: 'Normal', value: 'normal' } ],
				newFontStyleValue: 'italic',
				expected: '',
			},
			{
				message:
					'should return empty string if the new font style is invalid',
				availableFontStyles: [
					{ name: 'Regular', value: 'normal' },
					{ name: 'Italic', value: 'italic' },
				],
				newFontStyleValue: 'not-valid',
				expected: '',
			},
			{
				message: 'should return italic if oblique is not available',
				availableFontStyles: [
					{ name: 'Regular', value: 'normal' },
					{ name: 'Italic', value: 'italic' },
				],
				newFontStyleValue: 'oblique',
				expected: 'italic',
			},
			{
				message: 'should return normal if normal is available',
				availableFontStyles: [
					{ name: 'Regular', value: 'normal' },
					{ name: 'Italic', value: 'italic' },
				],
				newFontStyleValue: 'normal',
				expected: 'normal',
			},
		].forEach(
			( {
				message,
				availableFontStyles,
				newFontStyleValue,
				expected,
			} ) => {
				it( `${ message }`, () => {
					expect(
						findNearestFontStyle(
							availableFontStyles,
							newFontStyleValue
						)
					).toEqual( expected );
				} );
			}
		);
	} );

	describe( 'findNearestStyleAndWeight', () => {
		[
			{
				message: 'should return empty object when all values are empty',
				fontFamilyFaces: [],
				fontStyle: undefined,
				fontWeight: undefined,
				expected: {},
			},
			{
				message:
					'should return original fontStyle and fontWeight when fontFamilyFaces is empty',
				fontFamilyFaces: [],
				fontStyle: 'italic',
				fontWeight: '700',
				expected: {
					nearestFontStyle: 'italic',
					nearestFontWeight: '700',
				},
			},
			{
				message:
					'should return undefined values if both fontStyle and fontWeight are not available',
				fontFamilyFaces: [
					{
						fontFamily: 'ABeeZee',
						fontStyle: 'italic',
						fontWeight: '400',
						src: [
							'file:./assets/fonts/esDT31xSG-6AGleN2tCkkJUCGpG-GQ.woff2',
						],
					},
				],
				fontStyle: undefined,
				fontWeight: undefined,
				expected: {
					nearestFontStyle: undefined,
					nearestFontWeight: undefined,
				},
			},
			{
				message:
					'should return nearest fontStyle and fontWeight for normal/400',
				fontFamilyFaces: [
					{
						fontFamily: 'IBM Plex Mono',
						fontStyle: 'normal',
						fontWeight: '400',
						src: [
							'file:./assets/fonts/ibm-plex-mono/IBMPlexMono-Regular.woff2',
						],
					},
					{
						fontFamily: 'IBM Plex Mono',
						fontStyle: 'italic',
						fontWeight: '400',
						src: [
							'file:./assets/fonts/ibm-plex-mono/IBMPlexMono-Italic.woff2',
						],
					},
					{
						fontFamily: 'IBM Plex Mono',
						fontStyle: 'normal',
						fontWeight: '700',
						src: [
							'file:./assets/fonts/ibm-plex-mono/IBMPlexMono-Bold.woff2',
						],
					},
				],
				fontStyle: 'normal',
				fontWeight: '400',
				expected: {
					nearestFontStyle: 'normal',
					nearestFontWeight: '400',
				},
			},
			{
				message:
					'should return nearest fontStyle and fontWeight for normal/100',
				fontFamilyFaces: [
					{
						fontFamily: 'IBM Plex Mono',
						fontStyle: 'normal',
						fontWeight: '400',
						src: [
							'file:./assets/fonts/ibm-plex-mono/IBMPlexMono-Regular.woff2',
						],
					},
					{
						fontFamily: 'IBM Plex Mono',
						fontStyle: 'italic',
						fontWeight: '400',
						src: [
							'file:./assets/fonts/ibm-plex-mono/IBMPlexMono-Italic.woff2',
						],
					},
					{
						fontFamily: 'IBM Plex Mono',
						fontStyle: 'normal',
						fontWeight: '700',
						src: [
							'file:./assets/fonts/ibm-plex-mono/IBMPlexMono-Bold.woff2',
						],
					},
				],
				fontStyle: 'normal',
				fontWeight: '100',
				expected: {
					nearestFontStyle: 'normal',
					nearestFontWeight: '400',
				},
			},
			{
				message:
					'should return nearest fontStyle and fontWeight for italic/900',
				fontFamilyFaces: [
					{
						fontFamily: 'IBM Plex Mono',
						fontStyle: 'normal',
						fontWeight: '400',
						src: [
							'file:./assets/fonts/ibm-plex-mono/IBMPlexMono-Regular.woff2',
						],
					},
					{
						fontFamily: 'IBM Plex Mono',
						fontStyle: 'italic',
						fontWeight: '400',
						src: [
							'file:./assets/fonts/ibm-plex-mono/IBMPlexMono-Italic.woff2',
						],
					},
					{
						fontFamily: 'IBM Plex Mono',
						fontStyle: 'normal',
						fontWeight: '700',
						src: [
							'file:./assets/fonts/ibm-plex-mono/IBMPlexMono-Bold.woff2',
						],
					},
				],
				fontStyle: 'italic',
				fontWeight: '900',
				expected: {
					nearestFontStyle: 'italic',
					nearestFontWeight: '700',
				},
			},
			{
				message:
					'should return nearest fontStyle and fontWeight for oblique/600',
				fontFamilyFaces: [
					{
						fontFamily: 'IBM Plex Mono',
						fontStyle: 'normal',
						fontWeight: '400',
						src: [
							'file:./assets/fonts/ibm-plex-mono/IBMPlexMono-Regular.woff2',
						],
					},
					{
						fontFamily: 'IBM Plex Mono',
						fontStyle: 'italic',
						fontWeight: '700',
						src: [
							'file:./assets/fonts/ibm-plex-mono/IBMPlexMono-Bold.woff2',
						],
					},
				],
				fontStyle: 'oblique',
				fontWeight: '600',
				expected: {
					nearestFontStyle: 'italic',
					nearestFontWeight: '700',
				},
			},
			{
				message:
					'should return nearest fontStyle and fontWeight for 300 font weight and empty font style',
				fontFamilyFaces: [
					{
						fontFamily: 'IBM Plex Mono',
						fontStyle: 'normal',
						fontWeight: '400',
						src: [
							'file:./assets/fonts/ibm-plex-mono/IBMPlexMono-Regular.woff2',
						],
					},
					{
						fontFamily: 'IBM Plex Mono',
						fontStyle: 'italic',
						fontWeight: '700',
						src: [
							'file:./assets/fonts/ibm-plex-mono/IBMPlexMono-Bold.woff2',
						],
					},
				],
				fontStyle: undefined,
				fontWeight: '300',
				expected: {
					nearestFontStyle: 'normal',
					nearestFontWeight: '400',
				},
			},
			{
				message:
					'should return nearest fontStyle and fontWeight for oblique font style and empty font weight',
				fontFamilyFaces: [
					{
						fontFamily: 'IBM Plex Mono',
						fontStyle: 'normal',
						fontWeight: '400',
						src: [
							'file:./assets/fonts/ibm-plex-mono/IBMPlexMono-Regular.woff2',
						],
					},
					{
						fontFamily: 'IBM Plex Mono',
						fontStyle: 'italic',
						fontWeight: '700',
						src: [
							'file:./assets/fonts/ibm-plex-mono/IBMPlexMono-Bold.woff2',
						],
					},
				],
				fontStyle: 'oblique',
				fontWeight: undefined,
				expected: {
					nearestFontStyle: 'italic',
					nearestFontWeight: '400',
				},
			},
			{
				message:
					'should return nearest fontStyle and fontWeight for normal/400 when fontFamilyFaces contain numerical fontWeight value',
				fontFamilyFaces: [
					{
						fontFamily: 'IBM Plex Mono',
						fontStyle: 'normal',
						fontWeight: 400,
						src: [
							'file:./assets/fonts/ibm-plex-mono/IBMPlexMono-Regular.woff2',
						],
					},
					{
						fontFamily: 'IBM Plex Mono',
						fontStyle: 'italic',
						fontWeight: '400',
						src: [
							'file:./assets/fonts/ibm-plex-mono/IBMPlexMono-Italic.woff2',
						],
					},
					{
						fontFamily: 'IBM Plex Mono',
						fontStyle: 'normal',
						fontWeight: '700',
						src: [
							'file:./assets/fonts/ibm-plex-mono/IBMPlexMono-Bold.woff2',
						],
					},
				],
				fontStyle: 'normal',
				fontWeight: '400',
				expected: {
					nearestFontStyle: 'normal',
					nearestFontWeight: '400',
				},
			},
			{
				message:
					'should return nearest fontStyle and fontWeight for normal/400 when fontFamilyFaces contain undefined fontWeight value',
				fontFamilyFaces: [
					{
						fontFamily: 'IBM Plex Mono',
						fontStyle: 'normal',
						src: [
							'file:./assets/fonts/ibm-plex-mono/IBMPlexMono-Regular.woff2',
						],
					},
				],
				fontStyle: 'normal',
				fontWeight: '400',
				expected: {
					nearestFontStyle: 'normal',
					nearestFontWeight: '700',
				},
			},
		].forEach(
			( {
				message,
				fontFamilyFaces,
				fontStyle,
				fontWeight,
				expected,
			} ) => {
				it( `${ message }`, () => {
					expect(
						findNearestStyleAndWeight(
							fontFamilyFaces,
							fontStyle,
							fontWeight
						)
					).toEqual( expected );
				} );
			}
		);
	} );
} );
