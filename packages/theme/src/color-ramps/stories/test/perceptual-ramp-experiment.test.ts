import {
	ColorSpace,
	contrastAPCA,
	deltaEOK2,
	get,
	getLuminance,
	OKLab,
	OKLCH,
	OKLCH_sRGB as OklchSrgb,
	sRGB,
} from 'colorjs.io/fn';
import { describe, expect, it } from 'vitest';
import { checkAccessibleCombinations } from '../..';
import { getContrast } from '../../lib/color-utils';
import { DEFAULT_SEED_COLORS } from '../../lib/constants';
import {
	EXPERIMENTAL_RAMP_METHODS,
	buildExperimentalThemeRamps,
} from '../perceptual-ramp-experiment';

ColorSpace.register( sRGB );
ColorSpace.register( OKLab );
ColorSpace.register( OKLCH );
ColorSpace.register( OklchSrgb );

const SAMPLE_COMBINATIONS = [
	{ background: '#fcfcfc', primary: '#3858e9' },
	{ background: '#1e1e1e', primary: '#3858e9' },
	{ background: '#222524', primary: '#3858e9' },
	{ background: '#4f386e', primary: '#608010' },
	{ background: '#f8f8f8', primary: '#3858e9' },
	{ background: '#25292b', primary: '#3858e9' },
	{ background: '#eaeeed', primary: '#007cba' },
	{ background: '#3876a8', primary: '#437aa8' },
	{ background: '#5b534d', primary: '#916745' },
	{ background: '#413256', primary: '#a3b745' },
	{ background: '#5f787f', primary: '#567958' },
	{ background: '#3d4042', primary: '#cf4339' },
	{ background: '#cc4541', primary: '#ad631e' },
	// Synthetic stress cases for the polarity boundary and high-chroma gamut edges.
	{ background: '#777777', primary: '#d63638' },
	{ background: '#fcfcfc', primary: '#ffd700' },
	{ background: '#1e1e1e', primary: '#00ffff' },
] as const;

const FOREGROUND_STEPS = [
	'fgSurface1',
	'fgSurface2',
	'fgSurface3',
	'fgSurface4',
	'fgSurface5',
] as const;
const STROKE_STEPS = [ 'stroke1', 'stroke2', 'stroke3', 'stroke4' ] as const;

function getForegroundContrasts(
	background: string,
	ramp: ReturnType< typeof buildExperimentalThemeRamps >[ 'background' ]
) {
	return FOREGROUND_STEPS.map( ( step ) =>
		Math.abs( contrastAPCA( background, ramp.ramp[ step ] ) )
	);
}

describe( 'perceptual ramp experiment', () => {
	it.each( EXPERIMENTAL_RAMP_METHODS )(
		'builds complete %s ramps for every representative seed pair',
		( method ) => {
			for ( const seeds of SAMPLE_COMBINATIONS ) {
				const ramps = buildExperimentalThemeRamps( {
					method,
					...seeds,
				} );

				for ( const ramp of Object.values( ramps ) ) {
					expect( Object.keys( ramp.ramp ) ).toHaveLength( 23 );
					expect( Object.values( ramp.ramp ) ).not.toContain(
						undefined
					);
				}
			}
		}
	);

	it.each( EXPERIMENTAL_RAMP_METHODS )(
		'keeps every configured WCAG pair accessible in the %s ramps',
		( method ) => {
			for ( const seeds of SAMPLE_COMBINATIONS ) {
				const { background, primary, error } =
					buildExperimentalThemeRamps( { method, ...seeds } );

				for ( const ramp of [ background, primary, error ] ) {
					expect(
						checkAccessibleCombinations( { bgRamp: ramp } )
					).toEqual( [] );
				}

				for ( const ramp of [ primary, error ] ) {
					for ( const surface of [
						'surface1',
						'surface2',
						'surface3',
					] as const ) {
						for ( const foreground of [
							'fgSurface3',
							'fgSurface4',
							'fgSurface5',
						] as const ) {
							expect(
								getContrast(
									background.ramp[ surface ],
									ramp.ramp[ foreground ]
								)
							).toBeGreaterThanOrEqual( 4.5 );
						}
						expect(
							getContrast(
								background.ramp[ surface ],
								ramp.ramp.stroke3
							)
						).toBeGreaterThanOrEqual( 3 );
					}
				}
			}
		}
	);

	it( 'keeps supplied seeds at their anchors in the pinned-seed role hybrid', () => {
		for ( const seeds of SAMPLE_COMBINATIONS ) {
			const ramps = buildExperimentalThemeRamps( {
				method: 'pinned-role-hybrid',
				...seeds,
			} );

			expect(
				deltaEOK2( seeds.background, ramps.background.ramp.surface2 )
			).toBeLessThanOrEqual( 0.002 );
			expect(
				deltaEOK2( seeds.primary, ramps.primary.ramp.bgFill1 )
			).toBeLessThanOrEqual( 0.002 );
			expect(
				deltaEOK2( DEFAULT_SEED_COLORS.error, ramps.error.ramp.bgFill1 )
			).toBeLessThanOrEqual( 0.002 );
		}
	} );

	it.each( EXPERIMENTAL_RAMP_METHODS )(
		'orders foreground and stroke strength and keeps active fills darker in the %s ramps',
		( method ) => {
			for ( const seeds of SAMPLE_COMBINATIONS ) {
				const ramps = buildExperimentalThemeRamps( {
					method,
					...seeds,
				} );
				const displayBackground = ramps.background.ramp.surface2;

				for ( const ramp of Object.values( ramps ) ) {
					const contrasts = getForegroundContrasts(
						displayBackground,
						ramp
					);
					expect( contrasts ).toEqual(
						[ ...contrasts ].sort( ( a, b ) => a - b )
					);
					const strokeContrasts = STROKE_STEPS.map( ( step ) =>
						Math.abs(
							contrastAPCA(
								ramp.ramp.surface3,
								ramp.ramp[ step ]
							)
						)
					);
					expect( strokeContrasts ).toEqual(
						[ ...strokeContrasts ].sort( ( a, b ) => a - b )
					);
					expect( getLuminance( ramp.ramp.bgFill2 ) ).toBeLessThan(
						getLuminance( ramp.ramp.bgFill1 )
					);
					expect(
						getContrast( ramp.ramp.bgFill1, ramp.ramp.bgFill2 )
					).toBeGreaterThanOrEqual( 1.2 );
				}
			}
		}
	);

	it( 'keeps more accent chroma in the role-specific hybrid than in APCA-all', () => {
		for ( const seeds of SAMPLE_COMBINATIONS.slice( -2 ) ) {
			const apca = buildExperimentalThemeRamps( {
				method: 'apca-all',
				...seeds,
			} ).primary.ramp;
			const hybrid = buildExperimentalThemeRamps( {
				method: 'role-hybrid',
				...seeds,
			} ).primary.ramp;
			const seedChroma = get( seeds.primary, [ OklchSrgb, 'c' ] );
			const steps = [
				'surface4',
				'surface5',
				'stroke2',
				'stroke3',
			] as const;
			const totalDrift = ( ramp: typeof apca ) =>
				steps.reduce(
					( drift, step ) =>
						drift +
						Math.abs(
							get( ramp[ step ], [ OklchSrgb, 'c' ] ) - seedChroma
						),
					0
				);

			expect( totalDrift( hybrid ) ).toBeLessThanOrEqual(
				totalDrift( apca )
			);
		}
	} );

	it.each( [ 'role-hybrid', 'pinned-role-hybrid' ] as const )(
		'gives the %s a measurable active-state difference',
		( method ) => {
			for ( const seeds of SAMPLE_COMBINATIONS ) {
				const ramps = buildExperimentalThemeRamps( {
					method,
					...seeds,
				} );

				for ( const ramp of Object.values( ramps ) ) {
					expect(
						deltaEOK2( ramp.ramp.bgFill1, ramp.ramp.bgFill2 )
					).toBeGreaterThanOrEqual( 0.045 );
				}
			}
		}
	);

	it.each( EXPERIMENTAL_RAMP_METHODS )(
		'returns deterministic output for the %s method',
		( method ) => {
			const seeds = SAMPLE_COMBINATIONS[ 2 ];
			expect(
				buildExperimentalThemeRamps( { method, ...seeds } )
			).toEqual( buildExperimentalThemeRamps( { method, ...seeds } ) );
		}
	);
} );
