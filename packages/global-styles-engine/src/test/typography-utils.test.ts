/**
 * Tests for typography utility functions
 * Ported from Gutenberg's typography-utils.js tests
 */

/**
 * Internal dependencies
 */
import {
	getTypographyFontSizeValue,
	getFluidTypographyOptionsFromSettings,
} from '../utils/typography';

describe( 'typography utils', () => {
	describe( 'getTypographyFontSizeValue', () => {
		const testCases = [
			{
				message:
					'should return value when fluid typography is not active',
				preset: {
					size: '28px',
					name: 'preset',
					slug: 'preset',
				},
				typographySettings: undefined,
				expected: '28px',
			},
			{
				message: 'should return value where font size is 0',
				preset: {
					size: 0,
					name: 'preset',
					slug: 'preset',
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
					name: 'preset',
					slug: 'preset',
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
					name: 'preset',
					slug: 'preset',
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
					name: 'preset',
					slug: 'preset',
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
					name: 'preset',
					slug: 'preset',
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
					'should return clamp value with `minViewportWidth` override',
				preset: {
					size: '28px',
					name: 'preset',
					slug: 'preset',
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
					'should return clamp value with `maxViewportWidth` override',
				preset: {
					size: '28px',
					name: 'preset',
					slug: 'preset',
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
					name: 'preset',
					slug: 'preset',
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
				message: 'should return already clamped value',
				preset: {
					size: 'clamp(21px, 1.313rem + ((1vw - 7.68px) * 2.524), 42px)',
					name: 'preset',
					slug: 'preset',
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
					name: 'preset',
					slug: 'preset',
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
					name: 'preset',
					slug: 'preset',
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
				message: 'should return clamp value with em min and max units',
				preset: {
					size: '1.75em',
					name: 'preset',
					slug: 'preset',
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
					name: 'preset',
					slug: 'preset',
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
					name: 'preset',
					slug: 'preset',
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
					name: 'preset',
					slug: 'preset',
				},
				settings: {
					typography: {
						fluid: true,
					},
				},
				expected:
					'clamp(37.897px, 2.369rem + ((1vw - 3.2px) * 2.522), 70.175px)',
			},
		];

		testCases.forEach( ( { message, preset, settings, expected } ) => {
			// eslint-disable-next-line jest/valid-title
			it( message, () => {
				expect(
					getTypographyFontSizeValue( preset, settings || {} )
				).toEqual( expected );
			} );
		} );
	} );

	describe( 'getFluidTypographyOptionsFromSettings', () => {
		const testCases = [
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
		];

		testCases.forEach( ( { message, settings, expected } ) => {
			// eslint-disable-next-line jest/valid-title
			it( message, () => {
				expect(
					getFluidTypographyOptionsFromSettings( settings || {} )
				).toEqual( expected );
			} );
		} );
	} );
} );
