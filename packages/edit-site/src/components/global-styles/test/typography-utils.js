/**
 * Internal dependencies
 */
import { getTypographyFontSizeValue } from '../typography-utils';

describe( 'typography utils', () => {
	describe( 'getTypographyFontSizeValue', () => {
		it( 'should return the expected values', () => {
			[
				// Default return non-fluid value.
				{
					preset: {
						size: '28px',
					},
					typographySettings: undefined,
					expected: '28px',
				},
				// Default return non-fluid value where `size` is undefined.
				{
					preset: {
						size: undefined,
					},
					typographySettings: undefined,
					expected: undefined,
				},
				// Should return non-fluid value when fluid is `false`.
				{
					preset: {
						size: '28px',
						fluid: false,
					},
					typographySettings: {
						fluid: true,
					},
					expected: '28px',
				},
				// Should coerce number to `px` and return non-fluid value.
				{
					preset: {
						size: 33,
					},
					typographySettings: {
						fluid: true,
					},
					expected:
						'clamp(24.75px, 1.546875rem + ((1vw - 7.68px) * 2.975), 49.5px)',
				},
				// Should return fluid value.
				{
					preset: {
						size: '1.75rem',
					},
					typographySettings: {
						fluid: true,
					},
					expected:
						'clamp(1.3125rem, 1.3125rem + ((1vw - 0.48rem) * 2.524), 2.625rem)',
				},
				// Should return default fluid values with empty fluid array.
				{
					preset: {
						size: '28px',
						fluid: [],
					},
					typographySettings: {
						fluid: true,
					},
					expected:
						'clamp(21px, 1.3125rem + ((1vw - 7.68px) * 2.524), 42px)',
				},

				// Should return default fluid values with null values.
				{
					preset: {
						size: '28px',
						fluid: null,
					},
					typographySettings: {
						fluid: true,
					},
					expected:
						'clamp(21px, 1.3125rem + ((1vw - 7.68px) * 2.524), 42px)',
				},

				// Should return size with invalid fluid units.
				{
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
				// Should return fluid clamp value.
				{
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
				// Should return clamp value with default fluid max value.
				{
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
				// Should return clamp value with default fluid min value.
				{
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
						'clamp(21px, 1.3125rem + ((1vw - 7.68px) * 7.091), 80px)',
				},
			].forEach( ( { preset, typographySettings, expected } ) => {
				expect(
					getTypographyFontSizeValue( preset, typographySettings )
				).toBe( expected );
			} );
		} );
	} );
} );
