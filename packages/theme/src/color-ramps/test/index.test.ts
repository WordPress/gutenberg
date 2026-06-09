import { serialize, to, HSL, sRGB } from 'colorjs.io/fn';
import { buildRamp } from '../lib';
import { getColorString, getContrast } from '../lib/color-utils';
import {
	BG_RAMP_CONFIG,
	ACCENT_RAMP_CONFIG,
	resolveRampConfig,
} from '../lib/ramp-configs';
import {
	DEFAULT_SEED_COLORS,
	HIGH_CONTRAST_COMBINATIONS,
	LOW_LEGIBILITY_FLOOR_COMBINATIONS,
	LOW_CONTRAST_FROZEN_STEPS,
	SURFACE_BORDER_STROKE_STEPS,
	SURFACE_STEPS,
} from '../lib/constants';
import {
	buildBgRamp,
	buildAccentRamp,
	checkAccessibleCombinations,
} from '../index';

const lStops = [ 100, 90, 80, 70, 60, 50, 40, 30, 20, 10 ];
const sStops = [ 100, 80, 60, 40, 20, 0 ];
const hStops = [ 0, 60, 120, 180, 240, 300 ];

describe( 'buildRamps', () => {
	it( 'background ramp snapshots', () => {
		// Generate a set of HSL colors across a broad perceivable range to test
		// support for building ramps with various combinations of lightness,
		// saturation, and hue. Convert to a serialized string format to mirror
		// real-world consumer usage.
		const allBgColors: string[] = lStops.flatMap( ( l ) =>
			sStops.flatMap( ( s ) =>
				hStops.map( ( h ) =>
					serialize(
						to(
							{
								space: HSL,
								coords: [ h, s, l ] as [
									number,
									number,
									number,
								],
								alpha: 1,
							},
							sRGB
						)
					)
				)
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

describe( 'contrast levels', () => {
	const testSeeds = [
		DEFAULT_SEED_COLORS.bg,
		DEFAULT_SEED_COLORS.primary,
		'#1e1e1e',
		'#52accc',
	];

	it( 'default contrast level produces identical ramps to implicit default', () => {
		for ( const seed of testSeeds ) {
			const implicit = buildBgRamp( seed );
			const explicit = buildBgRamp( seed, 'default' );
			expect( explicit.ramp ).toEqual( implicit.ramp );
		}
	} );

	it( 'resolveRampConfig strips lightness constraints for low level', () => {
		const resolvedBg = resolveRampConfig( BG_RAMP_CONFIG, 'low' );
		const resolvedAccent = resolveRampConfig( ACCENT_RAMP_CONFIG, 'low' );

		expect( resolvedBg.fgSurface4.lightness ).toBeUndefined();
		expect( ACCENT_RAMP_CONFIG.fgSurface3.sameAsIfPossible ).toBe(
			'bgFill1'
		);
		expect( resolvedAccent.fgSurface3.sameAsIfPossible ).toBeUndefined();
	} );

	it( 'resolveRampConfig returns the same config for default level', () => {
		expect( resolveRampConfig( BG_RAMP_CONFIG, 'default' ) ).toBe(
			BG_RAMP_CONFIG
		);
	} );

	it( 'high contrast ramps meet raised accessibility targets', () => {
		for ( const bgSeed of [ DEFAULT_SEED_COLORS.bg, '#1e1e1e' ] ) {
			const bgRamp = buildBgRamp( bgSeed, 'high' );

			const unmet = checkAccessibleCombinations( {
				bgRamp,
				combinations: HIGH_CONTRAST_COMBINATIONS,
			} ).filter(
				// Ignore shortfalls within the builder's documented rounding
				// margin (UNIVERSAL_CONTRAST_TOPUP).
				( { unmetContrast, achievedContrast } ) =>
					unmetContrast - achievedContrast > 0.02
			);

			expect( unmet ).toEqual( [] );
		}
	} );

	it( 'low contrast ramps stay above the legibility floor', () => {
		for ( const bgSeed of [ DEFAULT_SEED_COLORS.bg, '#1e1e1e' ] ) {
			const bgRamp = buildBgRamp( bgSeed, 'low' );

			const unmet = checkAccessibleCombinations( {
				bgRamp,
				combinations: LOW_LEGIBILITY_FLOOR_COMBINATIONS,
			} );

			expect( unmet ).toEqual( [] );
		}
	} );

	it( 'high contrast produces stronger fg/stroke contrast than default', () => {
		const bgSeed = DEFAULT_SEED_COLORS.bg;
		const defaultRamp = buildBgRamp( bgSeed );
		const highRamp = buildBgRamp( bgSeed, 'high' );

		const defaultFgContrast = getContrast(
			defaultRamp.ramp.surface3,
			defaultRamp.ramp.fgSurface3
		);
		const highFgContrast = getContrast(
			highRamp.ramp.surface3,
			highRamp.ramp.fgSurface3
		);

		expect( highFgContrast ).toBeGreaterThanOrEqual( defaultFgContrast );
	} );

	it( 'low contrast foreground colors differ from default', () => {
		const defaultRamp = buildBgRamp( DEFAULT_SEED_COLORS.bg );
		const lowRamp = buildBgRamp( DEFAULT_SEED_COLORS.bg, 'low' );

		expect( lowRamp.ramp.fgSurface3 ).not.toBe(
			defaultRamp.ramp.fgSurface3
		);
		expect( lowRamp.ramp.fgSurface4 ).not.toBe(
			defaultRamp.ramp.fgSurface4
		);
	} );

	it( 'low contrast produces weaker fg contrast than default', () => {
		const bgSeed = DEFAULT_SEED_COLORS.bg;
		const defaultRamp = buildBgRamp( bgSeed );
		const lowRamp = buildBgRamp( bgSeed, 'low' );

		const defaultFgContrast = getContrast(
			defaultRamp.ramp.surface3,
			defaultRamp.ramp.fgSurface3
		);
		const lowFgContrast = getContrast(
			lowRamp.ramp.surface3,
			lowRamp.ramp.fgSurface3
		);

		expect( lowFgContrast ).toBeLessThanOrEqual( defaultFgContrast );
	} );

	it( 'low contrast produces weaker interactive stroke contrast than default', () => {
		const bgSeed = DEFAULT_SEED_COLORS.bg;
		const defaultRamp = buildBgRamp( bgSeed );
		const lowRamp = buildBgRamp( bgSeed, 'low' );

		const defaultStrokeContrast = getContrast(
			defaultRamp.ramp.surface3,
			defaultRamp.ramp.stroke3
		);
		const lowStrokeContrast = getContrast(
			lowRamp.ramp.surface3,
			lowRamp.ramp.stroke3
		);

		expect( lowStrokeContrast ).toBeLessThan( defaultStrokeContrast );
	} );

	it( 'surface steps are identical across contrast levels', () => {
		for ( const bgSeed of [ DEFAULT_SEED_COLORS.bg, '#1e1e1e' ] ) {
			const defaultRamp = buildBgRamp( bgSeed );
			const lowRamp = buildBgRamp( bgSeed, 'low' );
			const highRamp = buildBgRamp( bgSeed, 'high' );

			for ( const step of SURFACE_STEPS ) {
				expect( lowRamp.ramp[ step ] ).toBe( defaultRamp.ramp[ step ] );
				expect( highRamp.ramp[ step ] ).toBe(
					defaultRamp.ramp[ step ]
				);
			}
		}
	} );

	it( 'decorative stroke and fill steps match default in low contrast', () => {
		for ( const bgSeed of [ DEFAULT_SEED_COLORS.bg, '#1e1e1e' ] ) {
			const defaultRamp = buildBgRamp( bgSeed );
			const lowRamp = buildBgRamp( bgSeed, 'low' );

			for ( const step of LOW_CONTRAST_FROZEN_STEPS ) {
				if ( step.startsWith( 'surface' ) ) {
					continue;
				}
				expect( lowRamp.ramp[ step ] ).toBe( defaultRamp.ramp[ step ] );
			}
		}
	} );

	it( 'low contrast decorative strokes stay darker than surfaces on light seeds', () => {
		const ramp = buildBgRamp( DEFAULT_SEED_COLORS.bg, 'low' );

		for ( const stroke of SURFACE_BORDER_STROKE_STEPS ) {
			expect(
				getContrast( ramp.ramp.surface2, ramp.ramp[ stroke ] )
			).toBeGreaterThan( 1 );
		}
	} );

	it( 'accent surface steps are identical across contrast levels', () => {
		const bgSeed = DEFAULT_SEED_COLORS.bg;
		const primarySeed = DEFAULT_SEED_COLORS.primary;
		const defaultBgRamp = buildBgRamp( bgSeed );
		const defaultAccentRamp = buildAccentRamp( primarySeed, defaultBgRamp );
		const lowAccentRamp = buildAccentRamp(
			primarySeed,
			buildBgRamp( bgSeed, 'low' ),
			'low'
		);
		const highAccentRamp = buildAccentRamp(
			primarySeed,
			buildBgRamp( bgSeed, 'high' ),
			'high'
		);

		for ( const step of SURFACE_STEPS ) {
			expect( lowAccentRamp.ramp[ step ] ).toBe(
				defaultAccentRamp.ramp[ step ]
			);
			expect( highAccentRamp.ramp[ step ] ).toBe(
				defaultAccentRamp.ramp[ step ]
			);
		}
	} );
} );
