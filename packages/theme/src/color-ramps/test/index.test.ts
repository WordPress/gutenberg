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
	OKLrab,
	sRGB,
} from 'colorjs.io/fn';
import { buildAccentRamp, buildBgRamp, checkAccessibleCombinations } from '..';
import { buildRamp } from '../lib';
import {
	clampToGamut,
	getColorString,
	getContrast,
	parseSeedColor,
} from '../lib/color-utils';
import { BG_RAMP_CONFIG, ACCENT_RAMP_CONFIG } from '../lib/ramp-configs';
import { DEFAULT_SEED_COLORS } from '../lib/constants';
import {
	computeBetterFgColorDirection,
	sortByDependency,
	stepsForStep,
} from '../lib/utils';

const lStops = [ 100, 90, 80, 70, 60, 50, 40, 30, 20, 10 ];
const sStops = [ 100, 80, 60, 40, 20, 0 ];
const hStops = [ 0, 60, 120, 180, 240, 300 ];
const primaryColorGroups = [
	{ label: 'defaults', colors: Object.values( DEFAULT_SEED_COLORS ) },
	{
		label: 'admin themes',
		colors: [
			'#437aa8', // WP Admin "blue" theme accent
			'#916745', // WP Admin "coffee" theme accent
			'#646c3e', // WP Admin "ectoplasm" theme accent
			'#ad631e', // WP Admin "sunrise" theme accent
		],
	},
];

function expectAccessibleFillStates( ramp: ReturnType< typeof buildRamp > ) {
	const restingLuminance = getLuminance( ramp.ramp.bgFill1 );
	const activeLuminance = getLuminance( ramp.ramp.bgFill2 );

	if ( ramp.direction === 'darker' ) {
		expect( activeLuminance ).toBeLessThan( restingLuminance );
	} else {
		expect( activeLuminance ).toBeGreaterThan( restingLuminance );
	}
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

const foregroundSteps = [
	'fgSurface2',
	'fgSurface3',
	'fgSurface4',
	'fgSurface5',
] as const;

const MINIMUM_INTERACTION_STATE_APCA_INTERVAL = 14;
const MAXIMUM_ALTERNATE_POLARITY_DELTA_E_DRIFT = 0.02;

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

function getForegroundConstraintReferences(
	stepIndex: number,
	ramp: ReturnType< typeof buildBgRamp >,
	backgroundRamp: ReturnType< typeof buildBgRamp >
) {
	let surfaceNames: readonly ( keyof typeof ramp.ramp )[];
	if ( stepIndex === 0 ) {
		surfaceNames = [ 'surface3' ];
	} else if ( stepIndex === 1 ) {
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
	it( 'restores the weak intent background colors', () => {
		const bgRamp = buildBgRamp( DEFAULT_SEED_COLORS.background );
		const intentColors = [ 'info', 'success', 'warning', 'error' ] as const;
		const weakBackgrounds = Object.fromEntries(
			intentColors.map( ( intent ) => [
				intent,
				buildAccentRamp( DEFAULT_SEED_COLORS[ intent ], bgRamp ).ramp
					.surface2,
			] )
		);

		expect( weakBackgrounds ).toEqual( {
			info: '#f3f9ff',
			success: '#ebffed',
			warning: '#fff7e1',
			error: '#fff6f5',
		} );
	} );

	it.each( lStops )(
		'background ramp snapshots at lightness %i',
		( lightness ) => {
			// Generate a set of HSL colors across a broad perceivable range to test
			// support for building ramps with various combinations of lightness,
			// saturation, and hue. Convert to a serialized string format to mirror
			// real-world consumer usage.
			const allBgColors: string[] = sStops.flatMap( ( saturation ) =>
				hStops.map( ( hue ) =>
					serialize(
						to(
							{
								space: HSL,
								coords: [ hue, saturation, lightness ],
								alpha: 1,
							},
							sRGB
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
		}
	);

	it.each( primaryColorGroups )(
		'accent ramp snapshots for $label',
		( { colors } ) => {
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

			expect(
				colors.map( ( primary ) =>
					options.map( ( o ) => {
						const ramp = buildRamp(
							primary,
							ACCENT_RAMP_CONFIG,
							o
						);
						const seedOriginal = getColorString( primary );
						const seedComputed = getColorString(
							ramp.ramp.bgFill1
						);
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
		}
	);

	it( 'does not return warnings resolved by seed rescaling', () => {
		const result = buildBgRamp( '#3876a8' );

		expect( result.warnings ).toBeUndefined();
	} );

	it( 'keeps the serialized Blue stroke contrast at 3:1', () => {
		const result = buildBgRamp( '#3876a8' );

		expect(
			getContrast( result.ramp.surface3, result.ramp.stroke3 )
		).toBeGreaterThanOrEqual( 3 );
	} );

	it( 'keeps a feasible interaction-state interval after color serialization', () => {
		expect(
			BG_RAMP_CONFIG.foregroundScale.perceptualTargets.normalToActive
		).toBe( MINIMUM_INTERACTION_STATE_APCA_INTERVAL );

		const backgroundRamp = buildBgRamp( '#cc4541' );
		const primaryRamp = buildAccentRamp( '#1a1a1a', backgroundRamp );
		const normalContrast = getPerceptualContrastMagnitude(
			backgroundRamp.ramp.surface2,
			primaryRamp.ramp.fgSurface4
		);
		const activeContrast = getPerceptualContrastMagnitude(
			backgroundRamp.ramp.surface2,
			primaryRamp.ramp.fgSurface5
		);

		expect( activeContrast - normalContrast ).toBeGreaterThanOrEqual(
			MINIMUM_INTERACTION_STATE_APCA_INTERVAL
		);
		expect( primaryRamp.ramp.fgSurface5 ).toBe( '#fefefe' );
		expect(
			getPerceptualContrastMagnitude(
				backgroundRamp.ramp.surface2,
				'#fdfdfd'
			) - normalContrast
		).toBeLessThan( MINIMUM_INTERACTION_STATE_APCA_INTERVAL );
	} );

	it( 'preserves the largest legal interaction-state interval when both targets cannot fit', () => {
		const backgroundRamp = buildRamp( '#777777', BG_RAMP_CONFIG, {
			mainDirection: 'darker',
		} );
		const normal = backgroundRamp.ramp.fgSurface4;
		const active = backgroundRamp.ramp.fgSurface5;

		expect( normal ).not.toBe( active );
		expect(
			getPerceptualContrastMagnitude(
				backgroundRamp.ramp.surface2,
				active
			) -
				getPerceptualContrastMagnitude(
					backgroundRamp.ramp.surface2,
					normal
				)
		).toBeGreaterThan( 0 );

		for ( const reference of getForegroundConstraintReferences(
			3,
			backgroundRamp,
			backgroundRamp
		) ) {
			expect( getContrast( reference, normal ) ).toBeGreaterThanOrEqual(
				4.5
			);
		}
	} );

	it( 'uses the alternate middle-gray polarity when it improves interaction spacing within the seed drift bound', () => {
		const seed = '#777777';
		const preferredRamp = buildRamp( seed, BG_RAMP_CONFIG, {
			mainDirection: 'darker',
		} );
		const selectedRamp = buildBgRamp( seed );

		expect( selectedRamp.direction ).toBe( 'lighter' );
		expect( selectedRamp.warnings ).toBeUndefined();
		expect(
			checkAccessibleCombinations( { bgRamp: selectedRamp } )
		).toEqual( [] );
		expect(
			deltaEOK2( seed, selectedRamp.ramp.surface2 )
		).toBeLessThanOrEqual(
			deltaEOK2( seed, preferredRamp.ramp.surface2 ) +
				MAXIMUM_ALTERNATE_POLARITY_DELTA_E_DRIFT
		);
		expect(
			getPerceptualContrastMagnitude(
				selectedRamp.ramp.surface2,
				selectedRamp.ramp.fgSurface5
			) -
				getPerceptualContrastMagnitude(
					selectedRamp.ramp.surface2,
					selectedRamp.ramp.fgSurface4
				)
		).toBeGreaterThanOrEqual( MINIMUM_INTERACTION_STATE_APCA_INTERVAL );
	} );

	it( 'keeps the preferred polarity when the alternate would distort the seed', () => {
		const seed = '#a0a0a0';
		const preferredRamp = buildRamp( seed, BG_RAMP_CONFIG, {
			mainDirection: 'darker',
		} );
		const alternateRamp = buildRamp( seed, BG_RAMP_CONFIG, {
			mainDirection: 'lighter',
		} );
		const selectedRamp = buildBgRamp( seed );

		expect(
			deltaEOK2( seed, alternateRamp.ramp.surface2 ) -
				deltaEOK2( seed, preferredRamp.ramp.surface2 )
		).toBeGreaterThan( MAXIMUM_ALTERNATE_POLARITY_DELTA_E_DRIFT );
		expect( selectedRamp.direction ).toBe( 'darker' );
		expect( selectedRamp.ramp.surface2 ).toBe(
			preferredRamp.ramp.surface2
		);
	} );

	it( 'derives the strongest foreground without consuming the gamut endpoint', () => {
		const backgroundRamp = buildBgRamp( DEFAULT_SEED_COLORS.background );
		const ramps = [
			backgroundRamp,
			buildAccentRamp( DEFAULT_SEED_COLORS.primary, backgroundRamp ),
			buildAccentRamp( DEFAULT_SEED_COLORS.error, backgroundRamp ),
		];
		const endpointContrast = getPerceptualContrastMagnitude(
			backgroundRamp.ramp.surface2,
			'#000'
		);

		for ( const ramp of ramps ) {
			const foregroundContrast = getPerceptualContrastMagnitude(
				backgroundRamp.ramp.surface2,
				ramp.ramp.fgSurface5
			);

			expect( ramp.ramp.fgSurface5 ).not.toBe( '#000' );
			expect( endpointContrast - foregroundContrast ).toBeGreaterThan(
				0
			);
			expect( endpointContrast - foregroundContrast ).toBeLessThan( 4.5 );
		}
	} );

	it( 'separates weak, normal, and active semantic foregrounds', () => {
		const backgroundRamp = buildBgRamp( DEFAULT_SEED_COLORS.background );
		const ramps = [
			backgroundRamp,
			buildAccentRamp( DEFAULT_SEED_COLORS.primary, backgroundRamp ),
			buildAccentRamp( DEFAULT_SEED_COLORS.error, backgroundRamp ),
		];

		for ( const ramp of ramps ) {
			const contrasts = [
				getPerceptualContrastMagnitude(
					backgroundRamp.ramp.surface2,
					ramp.ramp.fgSurface3
				),
				getPerceptualContrastMagnitude(
					backgroundRamp.ramp.surface2,
					ramp.ramp.fgSurface4
				),
				getPerceptualContrastMagnitude(
					backgroundRamp.ramp.surface2,
					ramp.ramp.fgSurface5
				),
			];
			const normalInterval = contrasts[ 1 ] - contrasts[ 0 ];
			const activeInterval = contrasts[ 2 ] - contrasts[ 1 ];

			expect( normalInterval ).toBeGreaterThanOrEqual( 12 );
			expect( activeInterval ).toBeGreaterThanOrEqual(
				MINIMUM_INTERACTION_STATE_APCA_INTERVAL
			);
		}

		const normalContrasts = ramps.map( ( ramp ) =>
			getPerceptualContrastMagnitude(
				backgroundRamp.ramp.surface2,
				ramp.ramp.fgSurface4
			)
		);
		expect(
			Math.max( ...normalContrasts ) - Math.min( ...normalContrasts )
		).toBeLessThan( 1 );
	} );

	it.each( perceptualSampleCombinations )(
		'orders retained foreground steps and keeps their WCAG floors for $background and $primary',
		( { background, primary } ) => {
			const backgroundRamp = buildBgRamp( background );
			const ramps = [
				backgroundRamp,
				buildAccentRamp( primary, backgroundRamp ),
				buildAccentRamp( DEFAULT_SEED_COLORS.error, backgroundRamp ),
			];
			const contrastTargets = [ 3, 4.5, 4.5, 4.5 ];

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

	it.each( perceptualSampleCombinations )(
		'keeps elevation and emphasis surfaces in semantic order for $background and $primary',
		( { background, primary } ) => {
			const backgroundRamp = buildBgRamp( background );
			const ramps = [
				backgroundRamp,
				buildAccentRamp( primary, backgroundRamp ),
				buildAccentRamp( DEFAULT_SEED_COLORS.error, backgroundRamp ),
			];

			for ( const ramp of ramps ) {
				const lightness = ( step: keyof typeof ramp.ramp ) =>
					get( ramp.ramp[ step ], [ OKLrab, 'l' ] );
				const orderedSteps =
					ramp.direction === 'lighter'
						? [
								'surface1',
								'surface2',
								'surface3',
								'surface4',
								'surface5',
								'surface6',
						  ]
						: [
								'surface6',
								'surface5',
								'surface4',
								'surface1',
								'surface2',
								'surface3',
						  ];
				const lightnesses = orderedSteps.map( ( step ) =>
					lightness( step as keyof typeof ramp.ramp )
				);

				for ( let index = 1; index < lightnesses.length; index++ ) {
					expect( lightnesses[ index ] ).toBeGreaterThan(
						lightnesses[ index - 1 ]
					);
				}

				const lowerGap =
					lightness( 'surface2' ) - lightness( 'surface1' );
				const upperGap =
					lightness( 'surface3' ) - lightness( 'surface2' );
				const elevationGap = Math.max( lowerGap, upperGap );
				// Gaps stay balanced unless black or white clips one side.
				expect(
					Math.abs(
						lowerGap -
							Math.min( elevationGap, lightness( 'surface2' ) )
					)
				).toBeLessThan( 0.004 );
				expect(
					Math.abs(
						upperGap -
							Math.min(
								elevationGap,
								1 - lightness( 'surface2' )
							)
					)
				).toBeLessThan( 0.004 );
				expect(
					Math.abs(
						lightness( 'surface5' ) -
							( lightness( 'surface4' ) +
								lightness( 'surface6' ) ) /
								2
					)
				).toBeLessThan( 0.004 );
			}
		}
	);

	it.each( perceptualSampleCombinations )(
		'keeps stroke strength ordered and ST3 accessible for $background and $primary',
		( { background, primary } ) => {
			const backgroundRamp = buildBgRamp( background );
			const ramps = [
				backgroundRamp,
				buildAccentRamp( primary, backgroundRamp ),
				buildAccentRamp( DEFAULT_SEED_COLORS.error, backgroundRamp ),
			];

			for ( const ramp of ramps ) {
				const strokeContrasts = [
					'stroke1',
					'stroke2',
					'stroke3',
					'stroke4',
				].map( ( step ) =>
					Math.abs(
						contrastAPCA(
							ramp.ramp.surface3,
							ramp.ramp[ step as keyof typeof ramp.ramp ]
						)
					)
				);

				expect( strokeContrasts ).toEqual(
					[ ...strokeContrasts ].sort( ( a, b ) => a - b )
				);
				expect(
					getContrast( ramp.ramp.surface3, ramp.ramp.stroke3 )
				).toBeGreaterThanOrEqual( 3 );
			}
		}
	);

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

			for ( const step of [
				'fgSurface3',
				'fgSurface4',
				'fgSurface5',
			] as const ) {
				// FGS5 can approach a gamut boundary when both WCAG floors and
				// the active-state APCA interval require the remaining headroom.
				const maximumDifference = step === 'fgSurface5' ? 0.05 : 0.04;
				expect(
					Math.abs(
						get( primaryRamp.ramp[ step ], [ OklchSrgb, 'c' ] ) -
							seedRelativeChroma
					)
				).toBeLessThan( maximumDifference );
			}
		}
	);

	it.each( [
		{
			background: DEFAULT_SEED_COLORS.background,
			primary: DEFAULT_SEED_COLORS.primary,
			direction: 'darker',
		},
		{
			background: '#1e1e1e',
			primary: DEFAULT_SEED_COLORS.primary,
			direction: 'lighter',
		},
		{
			background: '#4f386e',
			primary: '#608010',
			direction: 'lighter',
		},
	] as const )(
		'moves active fills in the $direction ramp direction and keeps both foreground pairs accessible',
		( { background, primary, direction } ) => {
			const bgRamp = buildBgRamp( background );
			const accentRamp = buildAccentRamp( primary, bgRamp );
			const restingLuminance = getLuminance( accentRamp.ramp.bgFill1 );
			const activeLuminance = getLuminance( accentRamp.ramp.bgFill2 );

			expect( accentRamp.direction ).toBe( direction );
			if ( direction === 'darker' ) {
				expect( activeLuminance ).toBeLessThan( restingLuminance );
			} else {
				expect( activeLuminance ).toBeGreaterThan( restingLuminance );
			}
			expect(
				getContrast( accentRamp.ramp.bgFill1, accentRamp.ramp.fgFill )
			).toBeGreaterThanOrEqual( 4.5 );
			expect(
				getContrast( accentRamp.ramp.bgFill2, accentRamp.ramp.fgFill )
			).toBeGreaterThanOrEqual( 4.5 );
		}
	);

	it( 'retains the high-contrast foreground anchor when it satisfies both fill states', () => {
		const bgRamp = buildBgRamp( DEFAULT_SEED_COLORS.background );
		const accentRamp = buildAccentRamp(
			DEFAULT_SEED_COLORS.primary,
			bgRamp
		);

		expect( accentRamp.ramp.fgFill ).toBe( '#eff0f2' );
	} );

	it( 'orders every contrast reference before its dependent step', () => {
		const sortedSteps = sortByDependency( ACCENT_RAMP_CONFIG.steps );

		expect( sortedSteps.indexOf( 'bgFill1' ) ).toBeLessThan(
			sortedSteps.indexOf( 'fgFill' )
		);
		expect( sortedSteps.indexOf( 'bgFill2' ) ).toBeLessThan(
			sortedSteps.indexOf( 'fgFill' )
		);
	} );

	it( 'uses every contrast reference when choosing a direction', () => {
		expect( computeBetterFgColorDirection( '#333' ).better ).toBe(
			'lighter'
		);
		expect(
			computeBetterFgColorDirection( [
				clampToGamut( parseSeedColor( '#333' ) ),
				clampToGamut( parseSeedColor( '#eee' ) ),
			] ).better
		).toBe( 'darker' );
	} );

	it( 'checks every contrast reference before reusing a ramp color', () => {
		const config = {
			...ACCENT_RAMP_CONFIG,
			steps: {
				...ACCENT_RAMP_CONFIG.steps,
				fgFill: {
					...ACCENT_RAMP_CONFIG.steps.fgFill,
					sameAsIfPossible: 'bgFillInverted1' as const,
				},
			},
		};
		const ramp = buildRamp( '#1fad1f', config );

		expect(
			getContrast( ramp.ramp.bgFill1, ramp.ramp.bgFillInverted1 )
		).toBeGreaterThanOrEqual( 4.5 );
		expect(
			getContrast( ramp.ramp.bgFill2, ramp.ramp.bgFillInverted1 )
		).toBeLessThan( 4.5 );
		expect( ramp.ramp.fgFill ).not.toBe( ramp.ramp.bgFillInverted1 );
		expect(
			getContrast( ramp.ramp.bgFill2, ramp.ramp.fgFill )
		).toBeGreaterThanOrEqual( 4.5 );
	} );

	it( 'rescales a seed using every contrast reference', () => {
		const seed = '#85767a';
		const ramp = buildAccentRamp(
			seed,
			buildBgRamp( DEFAULT_SEED_COLORS.background )
		);

		expect( stepsForStep( 'fgFill', ACCENT_RAMP_CONFIG.steps ) ).toEqual(
			expect.arrayContaining( [ 'bgFill1', 'bgFill2' ] )
		);
		expect( ramp.ramp.bgFill1 ).not.toBe( seed );
		expect(
			getContrast( ramp.ramp.bgFill1, ramp.ramp.fgFill )
		).toBeGreaterThanOrEqual( 4.5 );
		expect(
			getContrast( ramp.ramp.bgFill2, ramp.ramp.fgFill )
		).toBeGreaterThanOrEqual( 4.5 );
	} );
} );
