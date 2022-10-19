/**
 * Internal dependencies
 */
import { getTypographyFontSizeValue } from '../typography-utils';

describe( 'typography utils', () => {
	describe( 'getTypographyFontSizeValue', () => {
		[
			{
				message: 'Default return non-fluid value.',
				preset: {
					size: '28px',
				},
				typographySettings: undefined,
				expected: '28px',
			},

			{
				message: 'Default return value where font size is 0.',
				preset: {
					size: 0,
				},
				typographySettings: undefined,
				expected: 0,
			},

			{
				message: "Default return value where font size is '0'.",
				preset: {
					size: '0',
				},
				typographySettings: undefined,
				expected: '0',
			},

			{
				message:
					'Default return non-fluid value where `size` is undefined.',
				preset: {
					size: undefined,
				},
				typographySettings: undefined,
				expected: undefined,
			},

			{
				message: 'return non-fluid value when fluid is `false`.',
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
				message:
					'Should coerce integer to `px` and return fluid value.',
				preset: {
					size: 33,
					fluid: true,
				},
				typographySettings: {
					fluid: true,
				},
				expected:
					'clamp(24.75px, 1.547rem + ((1vw - 7.68px) * 2.975), 49.5px)',
			},

			{
				message: 'coerce float to `px` and return fluid value.',
				preset: {
					size: 100.23,
					fluid: true,
				},
				typographySettings: {
					fluid: true,
				},
				expected:
					'clamp(75.173px, 4.698rem + ((1vw - 7.68px) * 9.035), 150.345px)',
			},

			{
				message: 'return incoming value when already clamped.',
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
				message: 'return incoming value with unsupported unit.',
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
				message: 'return fluid value.',
				preset: {
					size: '1.75rem',
				},
				typographySettings: {
					fluid: true,
				},
				expected:
					'clamp(1.313rem, 1.313rem + ((1vw - 0.48rem) * 2.523), 2.625rem)',
			},

			{
				message: 'return fluid value for floats with units.',
				preset: {
					size: '100.175px',
				},
				typographySettings: {
					fluid: true,
				},
				expected:
					'clamp(75.131px, 4.696rem + ((1vw - 7.68px) * 9.03), 150.263px)',
			},

			{
				message:
					'Should return default fluid values with empty fluid array.',
				preset: {
					size: '28px',
					fluid: [],
				},
				typographySettings: {
					fluid: true,
				},
				expected:
					'clamp(21px, 1.313rem + ((1vw - 7.68px) * 2.524), 42px)',
			},

			{
				message: 'return default fluid values with null value.',
				preset: {
					size: '28px',
					fluid: null,
				},
				typographySettings: {
					fluid: true,
				},
				expected:
					'clamp(21px, 1.313rem + ((1vw - 7.68px) * 2.524), 42px)',
			},

			{
				message:
					'return clamped value if min font size is greater than max.',
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
				expected:
					'clamp(5rem, 5rem + ((1vw - 0.48rem) * -5.769), 32px)',
			},

			{
				message: 'return size with invalid fluid units.',
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
					'return clamped using font size where no min is given and size is less than default min size.',
				preset: {
					size: '3px',
				},
				typographySettings: {
					fluid: true,
				},
				expected:
					'clamp(3px, 0.188rem + ((1vw - 7.68px) * 0.18), 4.5px)',
			},

			{
				message:
					'return fluid clamp value with different min max units.',
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
					'clamp(20px, 1.25rem + ((1vw - 7.68px) * 93.75), 50rem)',
			},
			//
			{
				message:
					' Should return clamp value with default fluid max value.',
				preset: {
					size: '28px',
					fluid: {
						min: '2.6rem',
					},
				},
				typographySettings: {
					fluid: true,
				},
				expected:
					'clamp(2.6rem, 2.6rem + ((1vw - 0.48rem) * 0.048), 42px)',
			},

			{
				message:
					'Should return clamp value with default fluid min value.',
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
					'clamp(21px, 1.313rem + ((1vw - 7.68px) * 7.091), 80px)',
			},

			{
				message: 'adjust computed min in px to min limit.',
				preset: {
					size: '14px',
				},
				typographySettings: {
					fluid: true,
				},
				expected:
					'clamp(14px, 0.875rem + ((1vw - 7.68px) * 0.841), 21px)',
			},

			{
				message: 'adjust computed min in rem to min limit.',
				preset: {
					size: '1.1rem',
				},
				typographySettings: {
					fluid: true,
				},
				expected:
					'clamp(0.875rem, 0.875rem + ((1vw - 0.48rem) * 1.49), 1.65rem)',
			},

			{
				message: 'adjust computed min in em to min limit.',
				preset: {
					size: '1.1em',
				},
				typographySettings: {
					fluid: true,
				},
				expected:
					'clamp(0.875em, 0.875rem + ((1vw - 0.48em) * 1.49), 1.65em)',
			},

			{
				message: 'adjust fluid min value in px to min limit',
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
					'clamp(14px, 0.875rem + ((1vw - 7.68px) * 1.923), 30px)',
			},

			{
				message: 'adjust fluid min value in rem to min limit.',
				preset: {
					size: '1.5rem',
					fluid: {
						min: '0.5rem',
					},
				},
				typographySettings: {
					fluid: true,
				},
				expected:
					'clamp(0.875rem, 0.875rem + ((1vw - 0.48rem) * 2.644), 2.25rem)',
			},

			{
				message: 'adjust fluid min value but honor max value.',
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
					'clamp(0.875rem, 0.875rem + ((1vw - 0.48rem) * 7.933), 5rem)',
			},

			{
				message:
					'return a fluid font size a min and max font sizes are equal.',
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
				expected: 'clamp(30px, 1.875rem + ((1vw - 7.68px) * 1), 30px)',
			},
		].forEach( ( { message, preset, typographySettings, expected } ) => {
			it( `should ${ message }`, () => {
				expect(
					getTypographyFontSizeValue( preset, typographySettings )
				).toBe( expected );
			} );
		} );
	} );
} );
