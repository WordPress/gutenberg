/**
 * Internal dependencies
 */
import {
	getTypographyFontSizeValue,
	getFluidTypographyOptionsFromSettings,
	getMergedFontFamiliesAndFontFamilyFaces,
	findNearestFontWeight,
	findNearestFontStyle,
	findNearestStyleAndWeight,
} from '../typography-utils';

describe( 'typography utils', () => {
	describe( 'getTypographyFontSizeValue', () => {
		[
			{
				message:
					'should return value when fluid typography is not active',
				preset: {
					size: '28px',
				},
				typographySettings: undefined,
				expected: '28px',
			},

			{
				message: 'should return value where font size is 0',
				preset: {
					size: 0,
				},
				typographySettings: {
					fluid: true,
				},
				expected: 0,
			},

			{
				message: "should return value where font size is '0'",
				preset: {
					size: '0',
				},
				typographySettings: {
					fluid: true,
				},
				expected: '0',
			},

			{
				message: 'should return value where `size` is `null`.',
				preset: {
					size: null,
				},
				typographySettings: {
					fluid: true,
				},
				expected: null,
			},

			{
				message: 'should return value when fluid is `false`',
				preset: {
					size: '28px',
					fluid: false,
				},
				settings: {
					typography: {
						fluid: true,
					},
				},
				expected: '28px',
			},

			{
				message: 'should return value when fluid config is empty`',
				preset: {
					size: '28px',
				},
				settings: {
					typography: {
						fluid: {},
					},
				},
				expected: '28px',
			},

			{
				message:
					'should return  clamp value with `minViewportWidth` override',
				preset: {
					size: '28px',
				},
				settings: {
					typography: {
						fluid: {
							minViewportWidth: '500px',
						},
					},
				},
				expected:
					'clamp(17.905px, 1.119rem + ((1vw - 5px) * 0.918), 28px)',
			},

			{
				message:
					'should return  clamp value with `maxViewportWidth` override',
				preset: {
					size: '28px',
				},
				settings: {
					typography: {
						fluid: {
							maxViewportWidth: '500px',
						},
					},
				},
				expected:
					'clamp(17.905px, 1.119rem + ((1vw - 3.2px) * 5.608), 28px)',
			},

			{
				message:
					'should return clamp value with `layout.wideSize` override',
				preset: {
					size: '28px',
				},
				settings: {
					typography: {
						fluid: true,
					},
					layout: {
						wideSize: '500px',
					},
				},
				expected:
					'clamp(17.905px, 1.119rem + ((1vw - 3.2px) * 5.608), 28px)',
			},

			{
				message:
					'should return clamp value with `maxViewportWidth` preferred over fallback `layout.wideSize` value',
				preset: {
					size: '28px',
				},
				settings: {
					typography: {
						fluid: {
							maxViewportWidth: '1000px',
						},
					},
					layout: {
						wideSize: '500px',
					},
				},
				expected:
					'clamp(17.905px, 1.119rem + ((1vw - 3.2px) * 1.485), 28px)',
			},

			{
				message: 'should return already clamped value',
				preset: {
					size: 'clamp(21px, 1.313rem + ((1vw - 7.68px) * 2.524), 42px)',
				},
				settings: {
					typography: {
						fluid: true,
					},
				},
				expected:
					'clamp(21px, 1.313rem + ((1vw - 7.68px) * 2.524), 42px)',
			},

			{
				message: 'should return value with unsupported unit',
				preset: {
					size: '1000%',
				},
				settings: {
					typography: {
						fluid: true,
					},
				},
				expected: '1000%',
			},

			{
				message: 'should return clamp value with rem min and max units',
				preset: {
					size: '1.75rem',
				},
				settings: {
					typography: {
						fluid: true,
					},
				},
				expected:
					'clamp(1.119rem, 1.119rem + ((1vw - 0.2rem) * 0.789), 1.75rem)',
			},

			{
				message:
					'should override default max viewport width fluid typography settings',
				preset: {
					size: '1.75rem',
				},
				settings: {
					typography: {
						fluid: {
							maxViewportWidth: '1200px',
						},
					},
				},
				expected:
					'clamp(1.119rem, 1.119rem + ((1vw - 0.2rem) * 1.147), 1.75rem)',
			},

			{
				message:
					'should override default min viewport width fluid typography settings',
				preset: {
					size: '1.75rem',
				},
				settings: {
					typography: {
						fluid: {
							minViewportWidth: '800px',
						},
					},
				},
				expected:
					'clamp(1.119rem, 1.119rem + ((1vw - 0.5rem) * 1.262), 1.75rem)',
			},

			{
				message: 'should return clamp value with em min and max units',
				preset: {
					size: '1.75em',
				},
				settings: {
					typography: {
						fluid: true,
					},
				},
				expected:
					'clamp(1.119em, 1.119rem + ((1vw - 0.2em) * 0.789), 1.75em)',
			},

			{
				message: 'should return clamp value for floats',
				preset: {
					size: '70.175px',
				},
				settings: {
					typography: {
						fluid: true,
					},
				},
				expected:
					'clamp(37.897px, 2.369rem + ((1vw - 3.2px) * 2.522), 70.175px)',
			},

			{
				message:
					'should coerce integer to `px` and returns clamp value',
				preset: {
					size: 33,
					fluid: true,
				},
				settings: {
					typography: {
						fluid: true,
					},
				},
				expected:
					'clamp(20.515px, 1.282rem + ((1vw - 3.2px) * 0.975), 33px)',
			},

			{
				message: 'should coerce float to `px` and returns clamp value',
				preset: {
					size: 70.175,
					fluid: true,
				},
				settings: {
					typography: {
						fluid: true,
					},
				},
				expected:
					'clamp(37.897px, 2.369rem + ((1vw - 3.2px) * 2.522), 70.175px)',
			},

			{
				message:
					'should return clamp value when `fluid` is empty array',
				preset: {
					size: '28px',
					fluid: [],
				},
				settings: {
					typography: {
						fluid: true,
					},
				},
				expected:
					'clamp(17.905px, 1.119rem + ((1vw - 3.2px) * 0.789), 28px)',
			},

			{
				message: 'should return clamp value when `fluid` is `null`',
				preset: {
					size: '28px',
					fluid: null,
				},
				settings: {
					typography: {
						fluid: true,
					},
				},
				expected:
					'clamp(17.905px, 1.119rem + ((1vw - 3.2px) * 0.789), 28px)',
			},

			{
				message:
					'returns clamp value where min and max fluid values defined',
				preset: {
					size: '80px',
					fluid: {
						min: '70px',
						max: '125px',
					},
				},
				settings: {
					typography: {
						fluid: true,
					},
				},
				expected:
					'clamp(70px, 4.375rem + ((1vw - 3.2px) * 4.297), 125px)',
			},

			{
				message:
					'should apply maxViewportWidth as maximum viewport width',
				preset: {
					size: '80px',
					fluid: {
						min: '70px',
						max: '125px',
					},
				},
				settings: {
					typography: {
						fluid: {
							maxViewportWidth: '1100px',
						},
					},
				},
				expected:
					'clamp(70px, 4.375rem + ((1vw - 3.2px) * 7.051), 125px)',
			},

			{
				message: 'returns clamp value where max is equal to size',
				preset: {
					size: '7.8125rem',
					fluid: {
						min: '4.375rem',
						max: '7.8125rem',
					},
				},
				settings: {
					typography: {
						fluid: true,
					},
				},
				expected:
					'clamp(4.375rem, 4.375rem + ((1vw - 0.2rem) * 4.298), 7.8125rem)',
			},

			{
				message:
					'should return clamp value if min font size is greater than max',
				preset: {
					size: '3rem',
					fluid: {
						min: '5rem',
						max: '32px',
					},
				},
				settings: {
					typography: {
						fluid: true,
					},
				},
				expected: 'clamp(5rem, 5rem + ((1vw - 0.2rem) * -3.75), 32px)',
			},

			{
				message: 'should return value with invalid min/max fluid units',
				preset: {
					size: '10em',
					fluid: {
						min: '20vw',
						max: '50%',
					},
				},
				settings: {
					typography: {
						fluid: true,
					},
				},
				expected: '10em',
			},

			{
				message:
					'should return value when size is < lower bounds and no fluid min/max set',
				preset: {
					size: '3px',
				},
				settings: {
					typography: {
						fluid: true,
					},
				},
				expected: '3px',
			},

			{
				message:
					'should return value when size is equal to lower bounds and no fluid min/max set',
				preset: {
					size: '14px',
				},
				settings: {
					typography: {
						fluid: true,
					},
				},
				expected: '14px',
			},

			{
				message:
					'should return clamp value with different min max units',
				preset: {
					size: '28px',
					fluid: {
						min: '20px',
						max: '50rem',
					},
				},
				settings: {
					typography: {
						fluid: true,
					},
				},
				expected:
					'clamp(20px, 1.25rem + ((1vw - 3.2px) * 60.938), 50rem)',
			},

			{
				message:
					'should return clamp value where no fluid max size is set',
				preset: {
					size: '50px',
					fluid: {
						min: '2.6rem',
					},
				},
				settings: {
					typography: {
						fluid: true,
					},
				},
				expected:
					'clamp(2.6rem, 2.6rem + ((1vw - 0.2rem) * 0.656), 50px)',
			},

			{
				message:
					'should return clamp value where no fluid min size is set',
				preset: {
					size: '28px',
					fluid: {
						max: '80px',
					},
				},
				settings: {
					typography: {
						fluid: true,
					},
				},
				expected:
					'clamp(17.905px, 1.119rem + ((1vw - 3.2px) * 4.851), 80px)',
			},

			{
				message:
					'should not apply lower bound test when fluid values are set',
				preset: {
					size: '1.5rem',
					fluid: {
						min: '0.5rem',
						max: '5rem',
					},
				},
				settings: {
					typography: {
						fluid: true,
					},
				},
				expected:
					'clamp(0.5rem, 0.5rem + ((1vw - 0.2rem) * 5.625), 5rem)',
			},

			{
				message:
					'should not apply lower bound test when only fluid min is set',
				preset: {
					size: '20px',
					fluid: {
						min: '12px',
					},
				},
				settings: {
					typography: {
						fluid: true,
					},
				},
				expected:
					'clamp(12px, 0.75rem + ((1vw - 3.2px) * 0.625), 20px)',
			},

			{
				message:
					'should not apply lower bound test when only fluid max is set',
				preset: {
					size: '0.875rem',
					fluid: {
						max: '20rem',
					},
				},
				settings: {
					typography: {
						fluid: true,
					},
				},
				expected:
					'clamp(0.875rem, 0.875rem + ((1vw - 0.2rem) * 23.906), 20rem)',
			},
			{
				message:
					'should return clamp value when min and max font sizes are equal',
				preset: {
					size: '4rem',
					fluid: {
						min: '30px',
						max: '30px',
					},
				},
				settings: {
					typography: {
						fluid: true,
					},
				},
				expected: 'clamp(30px, 1.875rem + ((1vw - 3.2px) * 1), 30px)',
			},

			{
				message:
					'should use default min font size value where min font size unit in fluid config is not supported',
				preset: {
					size: '15px',
				},
				settings: {
					typography: {
						fluid: {
							minFontSize: '16%',
						},
					},
				},
				expected:
					'clamp(14px, 0.875rem + ((1vw - 3.2px) * 0.078), 15px)',
			},

			// Equivalent custom config PHP unit tests in `test_should_convert_font_sizes_to_fluid_values()`.
			{
				message: 'should return clamp value using custom fluid config',
				preset: {
					size: '17px',
				},
				settings: {
					typography: {
						fluid: {
							minFontSize: '16px',
						},
					},
				},
				expected: 'clamp(16px, 1rem + ((1vw - 3.2px) * 0.078), 17px)',
			},

			{
				message:
					'should return value when font size <= custom min font size bound',
				preset: {
					size: '15px',
				},
				settings: {
					typography: {
						fluid: {
							minFontSize: '16px',
						},
					},
				},
				expected: '15px',
			},

			{
				message:
					'should apply scaled min font size for em values when custom min font size is not set',
				preset: {
					size: '12rem',
				},
				settings: {
					typography: {
						fluid: true,
					},
				},
				expected:
					'clamp(5.174rem, 5.174rem + ((1vw - 0.2rem) * 8.533), 12rem)',
			},

			{
				message:
					'should apply scaled min font size for px values when custom min font size is not set',
				preset: {
					size: '200px',
				},
				settings: {
					typography: {
						fluid: true,
					},
				},
				expected:
					'clamp(85.342px, 5.334rem + ((1vw - 3.2px) * 8.958), 200px)',
			},

			{
				message:
					'should not apply scaled min font size for minimum font size when custom min font size is set',
				preset: {
					size: '200px',
					fluid: {
						min: '100px',
					},
				},
				settings: {
					typography: {
						fluid: true,
					},
				},
				expected:
					'clamp(100px, 6.25rem + ((1vw - 3.2px) * 7.813), 200px)',
			},

			{
				message: 'should apply all custom fluid typography settings',
				preset: {
					size: '17px',
				},
				settings: {
					typography: {
						fluid: {
							minFontSize: '16px',
							maxViewportWidth: '1200px',
							minViewportWidth: '640px',
						},
					},
				},
				expected: 'clamp(16px, 1rem + ((1vw - 6.4px) * 0.179), 17px)',
			},

			// Individual preset settings override global settings.
			{
				message:
					'should convert individual preset size to fluid if fluid is disabled in global settings',
				preset: {
					size: '17px',
					fluid: true,
				},
				settings: {
					typography: {},
				},
				expected:
					'clamp(14px, 0.875rem + ((1vw - 3.2px) * 0.234), 17px)',
			},
			{
				message:
					'should use individual preset settings if fluid is disabled in global settings',
				preset: {
					size: '17px',
					fluid: {
						min: '16px',
						max: '26px',
					},
				},
				settings: {
					typography: {
						fluid: false,
					},
				},
				expected: 'clamp(16px, 1rem + ((1vw - 3.2px) * 0.781), 26px)',
			},
		].forEach( ( { message, preset, settings, expected } ) => {
			it( `${ message }`, () => {
				expect( getTypographyFontSizeValue( preset, settings ) ).toBe(
					expected
				);
			} );
		} );
	} );

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

	describe( 'typography utils', () => {
		[
			{
				message:
					'should return `undefined` when settings is `undefined`',
				settings: undefined,
				expected: { fluid: undefined },
			},

			{
				message:
					'should return `undefined` when typography is `undefined`',
				settings: {},
				expected: { fluid: undefined },
			},

			{
				message:
					'should return `undefined` when typography.fluid is `undefined`',
				settings: { typography: {} },
				expected: { fluid: undefined },
			},

			{
				message:
					'should return `false` when typography.fluid is disabled by `false`',
				settings: { typography: { fluid: false } },
				expected: { fluid: false },
			},

			{
				message: 'should return `{}` when typography.fluid is empty',
				settings: { typography: { fluid: {} } },
				expected: { fluid: {} },
			},

			{
				message:
					'should return false when typography.fluid is disabled and layout.wideSize is defined',
				settings: {
					typography: { fluid: false },
					layout: { wideSize: '1000rem' },
				},
				expected: { fluid: false },
			},

			{
				message:
					'should return true when fluid is enabled by a boolean',
				settings: { typography: { fluid: true } },
				expected: { fluid: true },
			},

			{
				message:
					'should return fluid settings with merged `layout.wideSize`',
				settings: {
					typography: { fluid: { minFontSize: '16px' } },
					layout: { wideSize: '1000rem' },
				},
				expected: {
					fluid: { maxViewportWidth: '1000rem', minFontSize: '16px' },
				},
			},

			{
				message:
					'should prioritize fluid `maxViewportWidth` over `layout.wideSize`',
				settings: {
					typography: { fluid: { maxViewportWidth: '10px' } },
					layout: { wideSize: '1000rem' },
				},
				expected: { fluid: { maxViewportWidth: '10px' } },
			},
			{
				message: 'should not merge `layout.wideSize` if it is fluid',
				settings: {
					typography: { fluid: { minFontSize: '16px' } },
					layout: { wideSize: 'clamp(1000px, 85vw, 2000px)' },
				},
				expected: {
					fluid: { minFontSize: '16px' },
				},
			},
		].forEach( ( { message, settings, expected } ) => {
			it( `${ message }`, () => {
				expect(
					getFluidTypographyOptionsFromSettings( settings )
				).toEqual( expected );
			} );
		} );
	} );
} );
