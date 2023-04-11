/**
 * Internal dependencies
 */
import { getTypographyFontSizeValue } from '../typography-utils';

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
				typographySettings: undefined,
				expected: 0,
			},

			{
				message: "should return value where font size is '0'",
				preset: {
					size: '0',
				},
				typographySettings: undefined,
				expected: '0',
			},

			{
				message: 'should return value where `size` is `null`.',
				preset: {
					size: null,
				},
				typographySettings: null,
				expected: null,
			},

			{
				message: 'should return value when fluid is `false`',
				preset: {
					size: '28px',
					fluid: false,
				},
				typographySettings: {
					fluid: true,
				},
				expected: '28px',
			},

			{
				message: 'should return already clamped value',
				preset: {
					size: 'clamp(21px, 1.313rem + ((1vw - 7.68px) * 2.524), 42px)',
					fluid: false,
				},
				typographySettings: {
					fluid: true,
				},
				expected:
					'clamp(21px, 1.313rem + ((1vw - 7.68px) * 2.524), 42px)',
			},

			{
				message: 'should return value with unsupported unit',
				preset: {
					size: '1000%',
					fluid: false,
				},
				typographySettings: {
					fluid: true,
				},
				expected: '1000%',
			},

			{
				message: 'should return clamp value with rem min and max units',
				preset: {
					size: '1.75rem',
				},
				typographySettings: {
					fluid: true,
				},
				expected:
					'clamp(1.05rem, 1.05rem + ((1vw - 0.2rem) * 0.875), 1.75rem)',
			},

			{
				message: 'should return clamp value with em min and max units',
				preset: {
					size: '1.75em',
				},
				typographySettings: {
					fluid: true,
				},
				expected:
					'clamp(1.05em, 1.05rem + ((1vw - 0.2em) * 0.875), 1.75em)',
			},

			{
				message: 'should return clamp value for floats',
				preset: {
					size: '70.175px',
				},
				typographySettings: {
					fluid: true,
				},
				expected:
					'clamp(34.377px, 2.149rem + ((1vw - 3.2px) * 2.797), 70.175px)',
			},

			{
				message:
					'should coerce integer to `px` and returns clamp value',
				preset: {
					size: 33,
					fluid: true,
				},
				typographySettings: {
					fluid: true,
				},
				expected:
					'clamp(19.154px, 1.197rem + ((1vw - 3.2px) * 1.082), 33px)',
			},

			{
				message: 'should coerce float to `px` and returns clamp value',
				preset: {
					size: 70.175,
					fluid: true,
				},
				typographySettings: {
					fluid: true,
				},
				expected:
					'clamp(34.377px, 2.149rem + ((1vw - 3.2px) * 2.797), 70.175px)',
			},

			{
				message:
					'should return clamp value when `fluid` is empty array',
				preset: {
					size: '28px',
					fluid: [],
				},
				typographySettings: {
					fluid: true,
				},
				expected:
					'clamp(16.804px, 1.05rem + ((1vw - 3.2px) * 0.875), 28px)',
			},

			{
				message: 'should return clamp value when `fluid` is `null`',
				preset: {
					size: '28px',
					fluid: null,
				},
				typographySettings: {
					fluid: true,
				},
				expected:
					'clamp(16.804px, 1.05rem + ((1vw - 3.2px) * 0.875), 28px)',
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
				typographySettings: {
					fluid: true,
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
				typographySettings: {
					fluid: true,
				},
				expected: '10em',
			},

			{
				message:
					'should return value when size is < lower bounds and no fluid min/max set',
				preset: {
					size: '3px',
				},
				typographySettings: {
					fluid: true,
				},
				expected: '3px',
			},

			{
				message:
					'should return value when size is equal to lower bounds and no fluid min/max set',
				preset: {
					size: '14px',
				},
				typographySettings: {
					fluid: true,
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
				typographySettings: {
					fluid: true,
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
				typographySettings: {
					fluid: true,
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
				typographySettings: {
					fluid: true,
				},
				expected:
					'clamp(16.804px, 1.05rem + ((1vw - 3.2px) * 4.937), 80px)',
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
				typographySettings: {
					fluid: true,
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
				typographySettings: {
					fluid: true,
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
				typographySettings: {
					fluid: true,
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
				typographySettings: {
					fluid: true,
				},
				expected: 'clamp(30px, 1.875rem + ((1vw - 3.2px) * 1), 30px)',
			},

			{
				message:
					'should use default min font size value where min font size unit in fluid config is not supported',
				preset: {
					size: '15px',
				},
				typographySettings: {
					fluid: {
						minFontSize: '16%',
					},
				},
				expected:
					'clamp(14px, 0.875rem + ((1vw - 3.2px) * 0.078), 15px)',
			},

			// Equivalent custom config PHP unit tests in `test_should_covert_font_sizes_to_fluid_values()`.
			{
				message: 'should return clamp value using custom fluid config',
				preset: {
					size: '17px',
				},
				typographySettings: {
					fluid: {
						minFontSize: '16px',
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
				typographySettings: {
					fluid: {
						minFontSize: '16px',
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
				typographySettings: {
					fluid: true,
				},
				expected:
					'clamp(4.429rem, 4.429rem + ((1vw - 0.2rem) * 9.464), 12rem)',
			},

			{
				message:
					'should apply scaled min font size for px values when custom min font size is not set',
				preset: {
					size: '200px',
				},
				typographySettings: {
					fluid: true,
				},
				expected:
					'clamp(72.84px, 4.553rem + ((1vw - 3.2px) * 9.934), 200px)',
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
				typographySettings: {
					fluid: true,
				},
				expected:
					'clamp(100px, 6.25rem + ((1vw - 3.2px) * 7.813), 200px)',
			},
		].forEach( ( { message, preset, typographySettings, expected } ) => {
			it( `${ message }`, () => {
				expect(
					getTypographyFontSizeValue( preset, typographySettings )
				).toBe( expected );
			} );
		} );
	} );
} );
