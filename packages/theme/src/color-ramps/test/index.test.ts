import { describe, expect, it } from 'vitest';
import {
	contrastAPCA,
	deltaEOK2,
	get,
	getLuminance,
	serialize,
	to,
	HSL,
	OKLCH_sRGB as OklchSrgb,
	sRGB,
} from 'colorjs.io/fn';
import { buildAccentRamp, buildBgRamp, checkAccessibleCombinations } from '..';
import { buildRamp } from '../lib';
import { getColorString, getContrast } from '../lib/color-utils';
import { BG_RAMP_CONFIG, ACCENT_RAMP_CONFIG } from '../lib/ramp-configs';
import { DEFAULT_SEED_COLORS } from '../lib/constants';

const lStops = [ 100, 90, 80, 70, 60, 50, 40, 30, 20, 10 ];
const sStops = [ 100, 80, 60, 40, 20, 0 ];
const hStops = [ 0, 60, 120, 180, 240, 300 ];

const foregroundSteps = [
	'fgSurface1',
	'fgSurface2',
	'fgSurface3',
	'fgSurface4',
	'fgSurface5',
] as const;

const perceptualSampleCombinations = [
	{
		background: DEFAULT_SEED_COLORS.background,
		primary: DEFAULT_SEED_COLORS.primary,
	},
	{ background: '#1e1e1e', primary: DEFAULT_SEED_COLORS.primary },
	{ background: '#4f386e', primary: '#608010' },
	{ background: '#777777', primary: '#d63638' },
	{ background: '#fcfcfc', primary: '#ffd700' },
	{ background: '#1e1e1e', primary: '#00ffff' },
] as const;

function getPerceptualContrastMagnitude(
	background: string,
	foreground: string
) {
	return Math.abs( contrastAPCA( background, foreground ) );
}

function expectAccessibleFillStates( ramp: ReturnType< typeof buildRamp > ) {
	expect( getLuminance( ramp.ramp.bgFill2 ) ).toBeLessThan(
		getLuminance( ramp.ramp.bgFill1 )
	);
	expect(
		getContrast( ramp.ramp.bgFill1, ramp.ramp.bgFill2 )
	).toBeGreaterThanOrEqual( 1.2 );
	expect(
		getContrast( ramp.ramp.bgFill1, ramp.ramp.fgFill )
	).toBeGreaterThanOrEqual( 4.5 );
	expect(
		getContrast( ramp.ramp.bgFill2, ramp.ramp.fgFill )
	).toBeGreaterThanOrEqual( 4.5 );
}

function getForegroundConstraintReferences(
	stepIndex: number,
	ramp: ReturnType< typeof buildBgRamp >,
	backgroundRamp: ReturnType< typeof buildBgRamp >
) {
	let surfaceNames: readonly ( keyof typeof ramp.ramp )[];
	if ( stepIndex < 2 ) {
		surfaceNames = [ 'surface3' ];
	} else if ( stepIndex < 3 ) {
		surfaceNames = [ 'surface1', 'surface2', 'surface3' ];
	} else {
		surfaceNames = [
			'surface1',
			'surface2',
			'surface3',
			'surface4',
			'surface5',
		];
	}

	return [
		...surfaceNames.map( ( name ) => ramp.ramp[ name ] ),
		...surfaceNames.map( ( name ) => backgroundRamp.ramp[ name ] ),
	];
}

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
				expectAccessibleFillStates( ramp );

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
			'#437aa8', // WP Admin "blue" theme accent
			'#916745', // WP Admin "coffee" theme accent
			'#646c3e', // WP Admin "ectoplasm" theme accent
			'#ad631e', // WP Admin "sunrise" theme accent
		];

		expect(
			allPrimaryColors.map( ( primary ) =>
				options.map( ( o ) => {
					const ramp = buildRamp( primary, ACCENT_RAMP_CONFIG, o );
					const seedOriginal = getColorString( primary );
					const seedComputed = getColorString( ramp.ramp.bgFill1 );
					expectAccessibleFillStates( ramp );

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

	it( 'does not return warnings resolved by seed rescaling', () => {
		const result = buildBgRamp( '#3876a8' );

		expect( result.warnings ).toBeUndefined();
	} );

	it( 'adds a fifth foreground step while preserving compliant anchors and the strong endpoint', () => {
		const backgroundRamp = buildBgRamp( DEFAULT_SEED_COLORS.background );
		const primaryRamp = buildAccentRamp(
			DEFAULT_SEED_COLORS.primary,
			backgroundRamp
		);

		expect(
			foregroundSteps.map( ( step ) => backgroundRamp.ramp[ step ] )
		).toEqual( [ '#aeaeae', '#8d8d8d', '#707070', '#646464', '#1e1e1e' ] );
		expect(
			foregroundSteps.map( ( step ) => primaryRamp.ramp[ step ] )
		).toEqual( [ '#86a9ff', '#5a82ff', '#3e60ea', '#3351e8', '#0b0070' ] );
	} );

	it.each( perceptualSampleCombinations )(
		'orders five foreground steps and keeps their WCAG floors for $background and $primary',
		( { background, primary } ) => {
			const backgroundRamp = buildBgRamp( background );
			const ramps = [
				backgroundRamp,
				buildAccentRamp( primary, backgroundRamp ),
				buildAccentRamp( DEFAULT_SEED_COLORS.error, backgroundRamp ),
			];
			const contrastTargets = [ 2, 3, 4.5, 4.5, 4.5 ];

			for ( const ramp of ramps ) {
				const perceptualContrasts = foregroundSteps.map( ( step ) =>
					getPerceptualContrastMagnitude(
						backgroundRamp.ramp.surface2,
						ramp.ramp[ step ]
					)
				);

				expect( perceptualContrasts ).toEqual(
					[ ...perceptualContrasts ].sort( ( a, b ) => a - b )
				);

				foregroundSteps.forEach( ( step, stepIndex ) => {
					for ( const reference of getForegroundConstraintReferences(
						stepIndex,
						ramp,
						backgroundRamp
					) ) {
						expect(
							getContrast( reference, ramp.ramp[ step ] )
						).toBeGreaterThanOrEqual(
							contrastTargets[ stepIndex ]
						);
					}
				} );
			}
		}
	);

	it( 'reserves at least 35 percent of the default-light perceptual range for the active step', () => {
		const backgroundRamp = buildBgRamp( DEFAULT_SEED_COLORS.background );
		const ramps = [
			backgroundRamp,
			buildAccentRamp( DEFAULT_SEED_COLORS.primary, backgroundRamp ),
			buildAccentRamp( DEFAULT_SEED_COLORS.error, backgroundRamp ),
		];

		for ( const ramp of ramps ) {
			const contrasts = foregroundSteps.map( ( step ) =>
				getPerceptualContrastMagnitude(
					backgroundRamp.ramp.surface2,
					ramp.ramp[ step ]
				)
			);
			const finalInterval = contrasts[ 4 ] - contrasts[ 3 ];
			const totalRange = contrasts[ 4 ] - contrasts[ 0 ];

			expect( finalInterval / totalRange ).toBeGreaterThanOrEqual( 0.35 );
			expect(
				deltaEOK2( ramp.ramp.fgSurface4, ramp.ramp.fgSurface5 )
			).toBeGreaterThan( 0 );
		}
	} );

	it.each( [
		{ background: '#4f386e', primary: '#608010' },
		{ background: '#fcfcfc', primary: '#ffd700' },
		{ background: '#1e1e1e', primary: '#00ffff' },
	] )(
		"preserves the accent seed's gamut-relative chroma for $background and $primary",
		( { background, primary } ) => {
			const backgroundRamp = buildBgRamp( background );
			const primaryRamp = buildAccentRamp( primary, backgroundRamp );
			const seedRelativeChroma = get( primaryRamp.ramp.bgFill1, [
				OklchSrgb,
				'c',
			] );

			for ( const step of [ 'fgSurface3', 'fgSurface4' ] as const ) {
				expect(
					Math.abs(
						get( primaryRamp.ramp[ step ], [ OklchSrgb, 'c' ] ) -
							seedRelativeChroma
					)
				).toBeLessThan( 0.04 );
			}
		}
	);

	it.each( [
		{ background: '#1e1e1e', primary: '#3858e9' },
		{ background: '#4f386e', primary: '#608010' },
		{ background: '#5b534d', primary: '#916745' },
	] )(
		'keeps active fills darker and both foreground pairs accessible for $background and $primary',
		( { background, primary } ) => {
			const backgroundRamp = buildBgRamp( background );
			const ramps = [
				backgroundRamp,
				buildAccentRamp( primary, backgroundRamp ),
				buildAccentRamp( DEFAULT_SEED_COLORS.error, backgroundRamp ),
			];

			for ( const ramp of ramps ) {
				expect( ramp.warnings ).toBeUndefined();
				expectAccessibleFillStates( ramp );
				expect(
					checkAccessibleCombinations( { bgRamp: ramp } )
				).not.toEqual(
					expect.arrayContaining( [
						expect.objectContaining( {
							bgName: 'bgFill2',
							fgName: 'fgFill',
						} ),
					] )
				);
			}
		}
	);

	it( 'minimally adjusts an accent seed at the fill foreground polarity boundary', () => {
		const seed = '#85767a';
		const accentRamp = buildAccentRamp(
			seed,
			buildBgRamp( DEFAULT_SEED_COLORS.background )
		);
		const seedLightness = get( seed, [ OklchSrgb, 'l' ] );
		const adjustedLightness = get( accentRamp.ramp.bgFill1, [
			OklchSrgb,
			'l',
		] );

		expect( accentRamp.ramp.bgFill1 ).not.toBe( seed );
		expect( Math.abs( adjustedLightness - seedLightness ) ).toBeLessThan(
			0.02
		);
		expect(
			getContrast( accentRamp.ramp.bgFill1, accentRamp.ramp.fgFill )
		).toBeGreaterThanOrEqual( 4.5 );
		expect(
			getContrast( accentRamp.ramp.bgFill2, accentRamp.ramp.fgFill )
		).toBeGreaterThanOrEqual( 4.5 );
		expect( getLuminance( accentRamp.ramp.bgFill2 ) ).toBeLessThan(
			getLuminance( accentRamp.ramp.bgFill1 )
		);
		expect(
			getContrast( accentRamp.ramp.bgFill1, accentRamp.ramp.bgFill2 )
		).toBeGreaterThanOrEqual( 1.2 );
	} );
} );
