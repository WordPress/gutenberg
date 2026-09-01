import { describe, expect, it } from 'vitest';
import {
	get,
	getLuminance,
	serialize,
	to,
	HSL,
	OKLCH,
	sRGB,
} from 'colorjs.io/fn';
import { buildAccentRamp, buildBgRamp } from '..';
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
	adjustContrastTarget,
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
	it( 'retains the richer background treatment instead of imposing a seed ceiling', () => {
		// The global seed ceiling changed this step to #8d5d5d.
		expect( buildBgRamp( '#996666' ).ramp.surface6 ).toBe( '#995758' );
	} );

	it.each( [
		{ scheme: 'Blue', background: '#3876a8' },
		{ scheme: 'Ocean', background: '#5f787f' },
	] )(
		'keeps weak neutral text at 4.5:1 or higher in the $scheme scheme',
		( { background } ) => {
			const { ramp, warnings } = buildBgRamp( background );

			expect(
				getContrast( ramp.surface3, ramp.fgSurface3 )
			).toBeGreaterThanOrEqual( 4.5 );
			expect( warnings ).toBeUndefined();
		}
	);

	it( 'does not warn when emitted colors meet the configured target but miss the rounding reserve', () => {
		const target = 20;
		const { ramp, warnings } = buildRamp(
			'rgb(0 10.6 0)',
			{
				...BG_RAMP_CONFIG,
				fgSurface3: {
					contrast: {
						reference: 'seed',
						followDirection: 'lighter',
						target,
					},
					lightness: () => 1,
				},
			},
			{ rescaleToFitContrastTargets: false }
		);
		const contrast = getContrast( ramp.surface2, ramp.fgSurface3 );

		expect( contrast ).toBeGreaterThanOrEqual( target );
		expect( contrast ).toBeLessThan( adjustContrastTarget( target ) );
		expect( warnings ?? [] ).not.toContain( 'fgSurface3' );
	} );

	it( 'warns when emitted colors miss the configured target', () => {
		const { ramp, warnings } = buildRamp(
			'rgb(0 10.6 0)',
			{
				...BG_RAMP_CONFIG,
				fgSurface3: {
					contrast: {
						reference: 'seed',
						followDirection: 'lighter',
						target: 20.05,
					},
					lightness: () => 1,
				},
			},
			{ rescaleToFitContrastTargets: false }
		);

		expect( getContrast( ramp.surface2, ramp.fgSurface3 ) ).toBeLessThan(
			20.05
		);
		expect( warnings ).toContain( 'fgSurface3' );
	} );

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

	it.each( [
		// The "Modern" and "Light" admin backgrounds.
		'#222524',
		'#eaeeed',
		// Near-white seeds whose tint is barely perceptible.
		'#fcfcfd',
		'#f6f7f9',
	] )(
		'keeps the generated neutral steps of near-gray seed %s near its hue and chroma',
		( seed ) => {
			const { ramp } = buildBgRamp( seed );
			const seedChroma = get( seed, [ OKLCH, 'c' ] );
			const seedHue = get( seed, [ OKLCH, 'h' ] );

			// Both steps retain tint for all four seeds after rounding.
			expect( get( ramp.surface1, [ OKLCH, 'c' ] ) ).toBeGreaterThan(
				0.001
			);
			expect( get( ramp.stroke3, [ OKLCH, 'c' ] ) ).toBeGreaterThan(
				0.001
			);

			for ( const step of [
				'surface1',
				'surface3',
				'surface6',
				'stroke1',
				'stroke2',
				'stroke3',
				'stroke4',
			] as const ) {
				const chroma = get( ramp[ step ], [ OKLCH, 'c' ] );

				// The neutral cap permits a small quadratic allowance. Use an
				// absolute reserve because RGB rounding dominates very faint tints.
				const ceiling = seedChroma * ( 1 + ( seedChroma / 0.02 ) ** 2 );
				expect( chroma ).toBeLessThanOrEqual( ceiling + 0.002 );

				// A faint enough tint can round to pure gray, which has no hue.
				if ( chroma < 0.001 ) {
					continue;
				}
				const hueDistance = Math.abs(
					get( ramp[ step ], [ OKLCH, 'h' ] ) - seedHue
				);
				// One 8-bit RGB step shifts the hue of such a faint tint by
				// up to about 20 degrees.
				expect(
					Math.min( hueDistance, 360 - hueDistance )
				).toBeLessThan( 25 );
			}
		}
	);

	it( 'keeps tapered accent surfaces gray for a near-gray primary', () => {
		const background = buildBgRamp( '#fcfcfc' );
		const { ramp } = buildAccentRamp( '#222524', background );

		expect( ramp.surface2 ).toBe( '#f8f8f8' );
		expect( ramp.surface6 ).toBe( '#d1d1d1' );
	} );

	it( 'does not return warnings resolved by seed rescaling', () => {
		const result = buildBgRamp( '#3876a8' );

		expect( result.warnings ).toBeUndefined();
	} );

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
			expect( Math.sign( activeLuminance - restingLuminance ) ).toBe(
				direction === 'darker' ? -1 : 1
			);
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
		const sortedSteps = sortByDependency( ACCENT_RAMP_CONFIG );

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
			fgFill: {
				...ACCENT_RAMP_CONFIG.fgFill,
				sameAsIfPossible: 'fgSurface4' as const,
			},
		};
		const ramp = buildRamp( '#1fad1f', config );

		expect(
			getContrast( ramp.ramp.bgFill1, ramp.ramp.fgSurface4 )
		).toBeGreaterThanOrEqual( 4.5 );
		expect(
			getContrast( ramp.ramp.bgFill2, ramp.ramp.fgSurface4 )
		).toBeLessThan( 4.5 );
		expect( ramp.ramp.fgFill ).not.toBe( ramp.ramp.fgSurface4 );
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

		expect( stepsForStep( 'fgFill', ACCENT_RAMP_CONFIG ) ).toEqual(
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
