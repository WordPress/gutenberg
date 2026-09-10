/**
 * Tests for spacing utility functions
 */

/**
 * Internal dependencies
 */
import { getSpacingSizeValue } from '../utils/spacing';

describe( 'spacing utils', () => {
	describe( 'getSpacingSizeValue', () => {
		const testCases = [
			{
				message: 'should return value when fluid spacing is not active',
				preset: {
					size: '1.75rem',
					name: 'preset',
					slug: 'preset',
				},
				settings: undefined,
				expected: '1.75rem',
			},
			{
				message: 'should return value when size is `0`',
				preset: {
					size: 0,
					name: 'preset',
					slug: 'preset',
				},
				settings: {
					spacing: {
						fluid: true,
					},
				},
				expected: 0,
			},
			{
				message: 'should return value when fluid is `false`',
				preset: {
					size: '1.75rem',
					fluid: false,
					name: 'preset',
					slug: 'preset',
				},
				settings: {
					spacing: {
						fluid: true,
					},
				},
				expected: '1.75rem',
			},
			{
				message:
					'should return value when global fluid is enabled but preset has no fluid bounds',
				preset: {
					size: '1.75rem',
					name: 'preset',
					slug: 'preset',
				},
				settings: {
					spacing: {
						fluid: true,
					},
				},
				expected: '1.75rem',
			},
			{
				message:
					'should return value when preset fluid is `true` with no explicit min/max',
				preset: {
					size: '1.75rem',
					fluid: true,
					name: 'preset',
					slug: 'preset',
				},
				settings: {},
				expected: '1.75rem',
			},
			{
				message:
					'should return value when preset fluid is missing `max`',
				preset: {
					size: '1.75rem',
					fluid: { min: '1.5rem' },
					name: 'preset',
					slug: 'preset',
				},
				settings: {},
				expected: '1.75rem',
			},
			{
				message:
					'should return clamp value with explicit min/max and default viewport widths',
				preset: {
					size: '1.75rem',
					fluid: { min: '1.5rem', max: '1.75rem' },
					name: 'preset',
					slug: 'preset',
				},
				settings: {},
				expected:
					'clamp(1.5rem, 1.5rem + ((1vw - 0.2rem) * 0.313), 1.75rem)',
			},
			{
				message: 'should return clamp value using px units',
				preset: {
					size: '32px',
					fluid: { min: '16px', max: '32px' },
					name: 'preset',
					slug: 'preset',
				},
				settings: {},
				expected: 'clamp(16px, 1rem + ((1vw - 3.2px) * 1.25), 32px)',
			},
			{
				message:
					'should return clamp value with custom global viewport widths',
				preset: {
					size: '2rem',
					fluid: { min: '1rem', max: '2rem' },
					name: 'preset',
					slug: 'preset',
				},
				settings: {
					spacing: {
						fluid: {
							minViewportWidth: '768px',
							maxViewportWidth: '1280px',
						},
					},
				},
				expected: 'clamp(1rem, 1rem + ((1vw - 0.48rem) * 3.125), 2rem)',
			},
		];

		testCases.forEach( ( { message, preset, settings, expected } ) => {
			// eslint-disable-next-line jest/valid-title
			it( message, () => {
				expect( getSpacingSizeValue( preset, settings || {} ) ).toEqual(
					expected
				);
			} );
		} );
	} );
} );
