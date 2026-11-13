import { get, OKLCH } from 'colorjs.io/fn';
import { describe, expect, it } from 'vitest';
import {
	buildAccentRamp,
	buildBgRamp,
	DEFAULT_SEED_COLORS,
	type RampResult,
} from '..';
import { clampToGamut, getContrast, parseSeedColor } from '../lib/color-utils';
import type { Ramp } from '../lib/types';

const LEVELS = Array.from( { length: 21 }, ( _, i ) => ( i - 10 ) / 10 );
const NEGATIVE_LEVELS = LEVELS.filter( ( level ) => level < 0 );
const POSITIVE_LEVELS = LEVELS.filter( ( level ) => level > 0 );

// The default light background and a dark sidebar background.
const LIGHT = DEFAULT_SEED_COLORS.background;
const DARK = '#25292b';

const ACCENT_NAMES = [
	'primary',
	'info',
	'success',
	'caution',
	'warning',
	'error',
] as const;

function buildTheme( background: string, contrast: number ) {
	const bg = buildBgRamp( background, contrast );
	const accents = Object.fromEntries(
		ACCENT_NAMES.map( ( name ) => [
			name,
			buildAccentRamp( DEFAULT_SEED_COLORS[ name ], bg, contrast ),
		] )
	) as Record< ( typeof ACCENT_NAMES )[ number ], RampResult >;
	return { bg, accents };
}

const contrastWith = ( ramp: Ramp, a: keyof Ramp, b: keyof Ramp ) =>
	getContrast( ramp[ a ], ramp[ b ] );

function oklch( color: string ) {
	const parsed = clampToGamut( parseSeedColor( color ) );
	return {
		l: get( parsed, [ OKLCH, 'l' ] ),
		c: get( parsed, [ OKLCH, 'c' ] ),
		h: get( parsed, [ OKLCH, 'h' ] ),
	};
}

describe( 'contrast scale', () => {
	it( 'produces the standard ramps at 0', () => {
		expect( buildBgRamp( DARK, 0 ) ).toEqual( buildBgRamp( DARK ) );
		const bg = buildBgRamp( LIGHT );
		expect( buildAccentRamp( '#3858e9', bg, 0 ) ).toEqual(
			buildAccentRamp( '#3858e9', bg )
		);
	} );

	it.each( [ LIGHT, DARK ] )(
		'reaches 7:1 for every text role at 1 on %s',
		( background ) => {
			const { bg, accents } = buildTheme( background, 1 );
			for ( const ramp of [ bg.ramp, accents.primary.ramp ] ) {
				expect(
					contrastWith( ramp, 'fgSurface4', 'surface3' )
				).toBeGreaterThanOrEqual( 7 );
				expect(
					contrastWith( ramp, 'fgSurface3', 'surface3' )
				).toBeGreaterThanOrEqual( 7 );
				expect(
					contrastWith( ramp, 'fgFill', 'bgFill1' )
				).toBeGreaterThanOrEqual( 7 );
			}
			expect(
				contrastWith( bg.ramp, 'fgFillInverted', 'bgFillInverted1' )
			).toBeGreaterThanOrEqual( 7 );
		}
	);

	it.each( [ LIGHT, DARK ] )(
		'softens body and weak text below 0 on %s',
		( background ) => {
			const standard = buildBgRamp( background ).ramp;
			const minimum = buildBgRamp( background, -1 ).ramp;
			for ( const step of [ 'fgSurface3', 'fgSurface4' ] as const ) {
				expect(
					contrastWith( minimum, step, 'surface3' )
				).toBeLessThan( contrastWith( standard, step, 'surface3' ) );
			}
		}
	);

	it.each( [ LIGHT, DARK ] )(
		'keeps the neutral solid fill below 0 and strengthens it above 0 on %s',
		( background ) => {
			const standard = buildBgRamp( background ).ramp;
			for ( const step of [
				'bgFillInverted1',
				'bgFillInverted2',
			] as const ) {
				const base = contrastWith( standard, step, 'surface2' );
				for ( const level of NEGATIVE_LEVELS ) {
					const ramp = buildBgRamp( background, level ).ramp;
					// `surface3`, which the fill is solved against, moves a
					// shade below 0, so allow for that.
					expect(
						contrastWith( ramp, step, 'surface2' ) / base
					).toBeCloseTo( 1, 1 );
				}
				const enhanced = buildBgRamp( background, 1 ).ramp;
				expect(
					contrastWith( enhanced, step, 'surface2' )
				).toBeGreaterThan( base );
			}
		}
	);

	it.each( [ LIGHT, DARK ] )(
		'keeps text on solid fills and the background seed below 0 on %s',
		( background ) => {
			const standard = buildTheme( background, 0 );
			for ( const level of NEGATIVE_LEVELS ) {
				const theme = buildTheme( background, level );
				expect( theme.bg.ramp.surface2 ).toBe(
					standard.bg.ramp.surface2
				);
				expect(
					contrastWith(
						theme.bg.ramp,
						'fgFillInverted',
						'bgFillInverted1'
					)
				).toBeGreaterThanOrEqual( 4.5 );
				for ( const name of ACCENT_NAMES ) {
					// The label keeps its standard contrast; its exact color can
					// shift a shade with the softened `bgFill2` it also meets.
					expect(
						contrastWith(
							theme.accents[ name ].ramp,
							'fgFill',
							'bgFill1'
						)
					).toBeGreaterThanOrEqual(
						Math.min(
							4.5,
							contrastWith(
								standard.accents[ name ].ramp,
								'fgFill',
								'bgFill1'
							)
						)
					);
				}
			}
		}
	);

	it.each( [ LIGHT, DARK ] )(
		'keeps the focus ring at 3:1 on %s',
		( background ) => {
			for ( const level of LEVELS ) {
				const { bg, accents } = buildTheme( background, level );
				for ( const surface of [
					bg.ramp.surface1,
					bg.ramp.surface2,
					bg.ramp.surface3,
					accents.primary.ramp.surface1,
				] ) {
					expect(
						getContrast( accents.primary.ramp.stroke3, surface )
					).toBeGreaterThanOrEqual( 3 );
				}
			}
		}
	);

	it.each( [ LIGHT, DARK ] )(
		'never strengthens a stroke against its surface below 0 on %s',
		( background ) => {
			const standard = buildTheme( background, 0 );
			const ramps = ( theme: typeof standard ) => [
				theme.bg,
				...ACCENT_NAMES.filter( ( name ) => name !== 'primary' ).map(
					( name ) => theme.accents[ name ]
				),
			];
			for ( const level of NEGATIVE_LEVELS ) {
				const theme = buildTheme( background, level );
				ramps( theme ).forEach( ( { ramp }, index ) => {
					const reference = ramps( standard )[ index ].ramp;
					for ( const step of [ 'stroke1', 'stroke3' ] as const ) {
						// Allow one 8-bit step of rounding.
						expect(
							contrastWith( ramp, step, 'surface2' )
						).toBeLessThanOrEqual(
							contrastWith( reference, step, 'surface2' ) * 1.02
						);
					}
				} );
			}
		}
	);

	it.each( [ LIGHT, DARK ] )(
		'keeps the field stroke at 1.5:1 at -1 on %s',
		( background ) => {
			const { ramp } = buildBgRamp( background, -1 );
			expect(
				contrastWith( ramp, 'stroke3', 'surface3' )
			).toBeGreaterThanOrEqual( 1.5 );
		}
	);

	it.each( [ LIGHT, DARK ] )(
		'keeps weak text at its distance from body text above 0 on %s',
		( background ) => {
			// Ramps with a darker main direction swap `surface1` and
			// `surface3` after solving; measure against the surface the
			// solver used.
			const solvedSurface = ( result: RampResult ) =>
				result.direction === 'darker' ? 'surface1' : 'surface3';
			const standard = buildBgRamp( background );
			const standardRatio =
				contrastWith(
					standard.ramp,
					'fgSurface4',
					solvedSurface( standard )
				) /
				contrastWith(
					standard.ramp,
					'fgSurface3',
					solvedSurface( standard )
				);
			for ( const level of POSITIVE_LEVELS ) {
				const result = buildBgRamp( background, level );
				const { ramp } = result;
				const surface = solvedSurface( result );
				const body = contrastWith( ramp, 'fgSurface4', surface );
				const weak = contrastWith( ramp, 'fgSurface3', surface );
				const target = 4.5 ** ( 1 + level * 0.3 );
				// Weak text stays at its target or the standard ratio below
				// body text, whichever is higher.
				expect( weak ).toBeGreaterThanOrEqual( target * 0.99 );
				expect( weak ).toBeLessThanOrEqual(
					Math.max( body / standardRatio, target ) * 1.03
				);
			}
		}
	);

	it( 'darkens a dark background above 0, keeping its hue', () => {
		const standard = oklch( buildBgRamp( DARK ).ramp.surface2 );
		const enhanced = oklch( buildBgRamp( DARK, 1 ).ramp.surface2 );
		expect( enhanced.l ).toBeLessThan( standard.l );
		expect( Math.abs( enhanced.h - standard.h ) ).toBeLessThan( 10 );
		expect( buildBgRamp( LIGHT, 1 ).ramp.surface2 ).toBe(
			buildBgRamp( LIGHT ).ramp.surface2
		);
	} );

	it( 'adjusts the brand seed gently at positive values', () => {
		const seed = oklch( '#3858e9' );
		const bg = buildBgRamp( LIGHT );
		for ( const level of POSITIVE_LEVELS ) {
			const adjusted = oklch(
				buildAccentRamp( '#3858e9', bg, level ).ramp.bgFill1
			);
			expect( Math.abs( adjusted.l - seed.l ) ).toBeLessThan( 0.1 );
			expect( Math.abs( adjusted.h - seed.h ) ).toBeLessThan( 5 );
		}
	} );

	it.each( [ LIGHT, DARK, '#0f3f2f', '#f4ecd8' ] )(
		'keeps every accent seed’s hue and color on %s',
		( background ) => {
			for ( const level of LEVELS ) {
				const { accents } = buildTheme( background, level );
				for ( const name of ACCENT_NAMES ) {
					const seed = oklch( DEFAULT_SEED_COLORS[ name ] );
					const fill = oklch( accents[ name ].ramp.bgFill1 );
					expect( fill.c ).toBeGreaterThan( seed.c * 0.5 );
					expect(
						Math.abs( ( ( fill.h - seed.h + 540 ) % 360 ) - 180 )
					).toBeLessThan( 10 );
				}
			}
		}
	);

	it.each( [ LIGHT, DARK, '#0f3f2f', '#f4ecd8' ] )(
		'builds every value without warnings on %s, apart from stroke4 above 0',
		( background ) => {
			for ( const level of LEVELS ) {
				const { bg, accents } = buildTheme( background, level );
				for ( const result of [ bg, ...Object.values( accents ) ] ) {
					const unexpected = ( result.warnings ?? [] ).filter(
						( step ) => ! ( step === 'stroke4' && level > 0 )
					);
					expect( { level, unexpected } ).toEqual( {
						level,
						unexpected: [],
					} );
				}
			}
		}
	);
} );
