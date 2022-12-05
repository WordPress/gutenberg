/**
 * Internal dependencies
 */
import { getTypographyFontSizeValue } from '../typography-utils';

describe( 'typography utils', () => {
	describe( 'getTypographyFontSizeValue', () => {
		[
			{
				message: 'returns value when fluid typography is deactivated',
				preset: {
					size: '28px',
				},
				typographySettings: undefined,
				expected: '28px',
			},

			{
				message: 'returns value where font size is 0',
				preset: {
					size: 0,
				},
				typographySettings: undefined,
				expected: 0,
			},

			{
				message: "returns value where font size is '0'",
				preset: {
					size: '0',
				},
				typographySettings: undefined,
				expected: '0',
			},

			{
				message: 'returns value where `size` is `null`.',
				preset: {
					size: null,
				},
				typographySettings: null,
				expected: null,
			},

			{
				message: 'returns value when fluid is `false`',
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
				message: 'returns already clamped value',
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
				message: 'returns value with unsupported unit',
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
				message: 'returns clamp value with rem min and max units',
				preset: {
					size: '1.75rem',
				},
				typographySettings: {
					fluid: true,
				},
				expected:
					'clamp(1.313rem, 1.313rem + ((1vw - 0.48rem) * 0.84), 1.75rem)',
			},

			{
				message: 'returns clamp value with eem min and max units',
				preset: {
					size: '1.75em',
				},
				typographySettings: {
					fluid: true,
				},
				expected:
					'clamp(1.313em, 1.313rem + ((1vw - 0.48em) * 0.84), 1.75em)',
			},

			{
				message: 'returns clamp value for floats',
				preset: {
					size: '100.175px',
				},
				typographySettings: {
					fluid: true,
				},
				expected:
					'clamp(75.131px, 4.696rem + ((1vw - 7.68px) * 3.01), 100.175px)',
			},

			{
				message: 'coerces integer to `px` and returns clamp value',
				preset: {
					size: 33,
					fluid: true,
				},
				typographySettings: {
					fluid: true,
				},
				expected:
					'clamp(24.75px, 1.547rem + ((1vw - 7.68px) * 0.992), 33px)',
			},

			{
				message: 'coerces float to `px` and returns clamp value',
				preset: {
					size: 100.23,
					fluid: true,
				},
				typographySettings: {
					fluid: true,
				},
				expected:
					'clamp(75.173px, 4.698rem + ((1vw - 7.68px) * 3.012), 100.23px)',
			},

			{
				message: 'returns clamp value when `fluid` is empty array',
				preset: {
					size: '28px',
					fluid: [],
				},
				typographySettings: {
					fluid: true,
				},
				expected:
					'clamp(21px, 1.313rem + ((1vw - 7.68px) * 0.841), 28px)',
			},

			{
				message: 'returns clamp value when `fluid` is `null`',
				preset: {
					size: '28px',
					fluid: null,
				},
				typographySettings: {
					fluid: true,
				},
				expected:
					'clamp(21px, 1.313rem + ((1vw - 7.68px) * 0.841), 28px)',
			},

			{
				message:
					'returns clamp value if min font size is greater than max',
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
				message: 'returns value with invalid min/max fluid units',
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
					'returns value when size is < lower bounds and no fluid min/max set',
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
					'returns value when size is equal to lower bounds and no fluid min/max set',
				preset: {
					size: '14px',
				},
				typographySettings: {
					fluid: true,
				},
				expected: '14px',
			},

			{
				message: 'returns clamp value with different min max units',
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

			{
				message: 'returns clamp value where no fluid max size is set',
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
					'clamp(2.6rem, 2.6rem + ((1vw - 0.48rem) * -1.635), 28px)',
			},

			{
				message: 'returns clamp value where no fluid min size is set',
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
					'clamp(0.5rem, 0.5rem + ((1vw - 0.48rem) * 8.654), 5rem)',
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
					'clamp(12px, 0.75rem + ((1vw - 7.68px) * 0.962), 20px)',
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
					'clamp(0.875rem, 0.875rem + ((1vw - 0.48rem) * 36.779), 20rem)',
			},

			{
				message:
					'returns clamp value when min and max font sizes are equal',
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
