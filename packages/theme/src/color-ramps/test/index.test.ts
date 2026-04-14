/**
 * Internal dependencies
 */
import '../lib/register-color-spaces';
import { buildRamp } from '../lib';
import { getColorString } from '../lib/color-utils';
import { BG_RAMP_CONFIG, ACCENT_RAMP_CONFIG } from '../lib/ramp-configs';
import { DEFAULT_SEED_COLORS } from '../lib/constants';

const lStops = [ 100, 90, 80, 70, 60, 50, 40, 30, 20, 10 ];
const sStops = [ 100, 80, 60, 40, 20, 0 ];
const hStops = [ 0, 60, 120, 180, 240, 300 ];

describe( 'buildRamps', () => {
	it( 'background ramp snapshots', () => {
		const allBgColors = lStops.flatMap( ( l ) =>
			sStops.flatMap( ( s ) =>
				hStops.map( ( h ) => `hsl(${ h }deg ${ s }% ${ l }%)` )
			)
		);

		expect(
			allBgColors.map( ( bg ) => {
				const ramp = buildRamp( bg, BG_RAMP_CONFIG );
				const seedOriginal = getColorString( bg );
				const seedComputed = getColorString( ramp.ramp.surface2 );

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
	}, 10000 );

	it( 'accent ramp snapshots', () => {
		const options = [
			{
				pinLightness: { stepName: 'surface2', value: 0 },
				mainDirection: 'lighter',
			},
			{
				pinLightness: { stepName: 'surface2', value: 0.1 },
				mainDirection: 'lighter',
			},
			{
				pinLightness: { stepName: 'surface2', value: 0.2 },
				mainDirection: 'lighter',
			},
			{
				pinLightness: { stepName: 'surface2', value: 0.3 },
				mainDirection: 'lighter',
			},
			{
				pinLightness: { stepName: 'surface2', value: 0.4 },
				mainDirection: 'lighter',
			},
			{
				pinLightness: { stepName: 'surface2', value: 0.7 },
				mainDirection: 'darker',
			},
			{
				pinLightness: { stepName: 'surface2', value: 0.8 },
				mainDirection: 'darker',
			},
			{
				pinLightness: { stepName: 'surface2', value: 0.9 },
				mainDirection: 'darker',
			},
			{
				pinLightness: { stepName: 'surface2', value: 1 },
				mainDirection: 'darker',
			},
		] as const;

		const allPrimaryColors = [
			...Object.values( DEFAULT_SEED_COLORS ),
			'#52accc', // WP Admin "blue" theme accent
			'#c7a589', // WP Admin "coffee" theme accent
			'#a3b745', // WP Admin "ectoplasm" theme accent
			'#dd823b', // WP Admin "sunrise" theme accent
		];

		expect(
			allPrimaryColors.map( ( primary ) =>
				options.map( ( o ) => {
					const ramp = buildRamp( primary, ACCENT_RAMP_CONFIG, o );
					const seedOriginal = getColorString( primary );
					const seedComputed = getColorString( ramp.ramp.bgFill1 );

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
