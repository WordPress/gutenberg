/**
 * External dependencies
 */
// Disable reason: ESLint resolver can't handle `exports`. Import resolver
// checking is redundant in TypeScript files.
// eslint-disable-next-line import/no-unresolved
import { parse, to, serialize, sRGB } from 'colorjs.io/fn';

/**
 * Internal dependencies
 */
import '../lib/register-color-spaces';
import { buildRamp } from '../lib';
import { BG_RAMP_CONFIG, ACCENT_RAMP_CONFIG } from '../lib/ramp-configs';
import { DEFAULT_SEED_COLORS } from '../lib/constants';

describe( 'buildRamps', () => {
	it( 'background ramp snapshots', () => {
		// Representative sample covering edge cases and various hue/saturation/lightness combinations
		const allBgColors = [
			'hsl(0deg 0% 30%)', // Dark gray (desaturated)
			'hsl(120deg 50% 60%)', // Mid-range green
			'hsl(240deg 100% 30%)', // Dark saturated blue
		];

		expect(
			allBgColors.map( ( bg ) => {
				const ramp = buildRamp( bg, BG_RAMP_CONFIG );
				const seedOriginal = serialize( to( parse( bg ), sRGB ), {
					format: 'hex',
					inGamut: true,
				} );
				const seedComputed = serialize(
					to( parse( ramp.ramp.surface2.color ), sRGB ),
					{
						format: 'hex',
						inGamut: true,
					}
				);

				return {
					input: {
						seedOriginal,
						seedComputed,
						seedUnchanged: seedOriginal === seedComputed,
					},
					output: ramp,
				};
			} )
		).toMatchSnapshot();
	} );

	it( 'accent ramp snapshots', () => {
		// Representative sample covering key option combinations
		const options = [
			{
				pinLightness: { stepName: 'surface2', value: 0 },
				mainDirection: 'lighter',
			},
			{
				pinLightness: { stepName: 'surface2', value: 0.5 },
				mainDirection: 'lighter',
			},
			{
				pinLightness: { stepName: 'surface2', value: 1 },
				mainDirection: 'darker',
			},
		] as const;

		// Representative sample covering different hue ranges and saturation levels
		const allPrimaryColors = [
			DEFAULT_SEED_COLORS.primary, // WP blue (mid saturation)
			DEFAULT_SEED_COLORS.error, // WP error red (saturated)
			'#c7a589', // WP Admin "coffee" theme accent (desaturated/beige)
		];

		expect(
			allPrimaryColors.map( ( primary ) =>
				options.map( ( o ) => {
					const ramp = buildRamp( primary, ACCENT_RAMP_CONFIG, o );
					const seedOriginal = serialize(
						to( parse( primary ), sRGB ),
						{
							format: 'hex',
							inGamut: true,
						}
					);
					const seedComputed = serialize(
						to( parse( ramp.ramp.bgFill1.color ), sRGB ),
						{
							format: 'hex',
							inGamut: true,
						}
					);

					return {
						input: {
							seedOriginal,
							seedComputed,
							seedUnchanged: seedOriginal === seedComputed,
							bgInfo: o,
						},
						output: ramp,
					};
				} )
			)
		).toMatchSnapshot();
	} );
} );
