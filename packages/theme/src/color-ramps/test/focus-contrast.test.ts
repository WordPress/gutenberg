import { describe, expect, it } from 'vitest';
import { get, OKLCH } from 'colorjs.io/fn';
import { buildAccentRamp, buildBgRamp } from '..';
import { getContrast } from '../lib/color-utils';

describe( 'accent focus contrast', () => {
	it.each( [
		[ '#cc4541', '#ad631e' ],
		[ '#1ae427', '#646c3e' ],
		[ 'rgb(9.9% 9.9% 10.1%)', '#3858e9' ],
		[ '#00ffff', '#ffffff' ],
		[ '#13a586', '#3858e9' ],
		[ '#330000', '#3858e9' ],
	] )(
		'keeps brand focus, fills, and text accessible for background %s and primary %s',
		( background, primary ) => {
			const neutral = buildBgRamp( background );
			const before = JSON.stringify( neutral );
			const { ramp, warnings } = buildAccentRamp(
				'primary',
				primary,
				neutral
			);
			for ( const surface of [
				neutral.ramp.surface1,
				neutral.ramp.surface2,
				neutral.ramp.surface3,
				ramp.surface1,
			] ) {
				for ( const step of [
					'stroke3',
					'bgFill1',
					'bgFill2',
				] as const ) {
					expect(
						getContrast( ramp[ step ], surface )
					).toBeGreaterThanOrEqual( 3 );
				}
				for ( const step of [ 'fgSurface3', 'fgSurface4' ] as const ) {
					expect(
						getContrast( ramp[ step ], surface )
					).toBeGreaterThanOrEqual( 4.5 );
				}
			}
			expect( warnings ).toBeUndefined();
			expect(
				getContrast( ramp.bgFill1, ramp.fgFill )
			).toBeGreaterThanOrEqual( 4.5 );
			expect(
				getContrast( ramp.bgFill2, ramp.fgFill )
			).toBeGreaterThanOrEqual( 4.5 );
			expect(
				getContrast( ramp.bgFill1, ramp.bgFill2 )
			).toBeGreaterThanOrEqual( 1.2 );
			expect( JSON.stringify( neutral ) ).toBe( before );
		}
	);

	it.each( [ '#007cba', '#437aa8' ] )(
		'keeps the supplied brand fill %s when the emitted colors meet the targets',
		( seed ) => {
			const neutral = buildBgRamp( '#fcfcfc' );
			expect(
				buildAccentRamp( 'primary', seed, neutral ).ramp.bgFill1
			).toBe( seed );
		}
	);

	it.each( [
		[ '#000000', '#3858e9', '#fff' ],
		[ '#3f3f3f', '#8f8f8f', '#1e1e1e' ],
		[ '#000000', '#5f5f5f', '#f2f2f2' ],
	] )(
		'keeps the brand fill and its text on background %s when primary %s already meets the targets',
		( background, seed, text ) => {
			const { ramp, warnings } = buildAccentRamp(
				'primary',
				seed,
				buildBgRamp( background )
			);
			expect( warnings ).toBeUndefined();
			expect( ramp.bgFill1 ).toBe( seed );
			expect( ramp.fgFill ).toBe( text );
		}
	);

	it( 'keeps a passing seed when the seed search ends on a failing one', () => {
		expect(
			buildAccentRamp( 'primary', '#000000', buildBgRamp( '#608010' ) )
				.warnings
		).toBeUndefined();
	} );

	it.each( [
		[ '#ffffff', [ '#8d8d8d', '#8e8e8e', '#8f8f8f' ] ],
		[ '#fcfcfc', [ '#a2a2a2', '#a3a3a3' ] ],
	] )(
		'gives neighboring seeds on background %s the same fill and text',
		( background, seeds ) => {
			const neutral = buildBgRamp( background );
			const ramps = seeds.map(
				( seed ) => buildAccentRamp( 'primary', seed, neutral ).ramp
			);
			for ( const ramp of ramps ) {
				expect( ramp.bgFill1 ).toBe( ramps[ 0 ].bgFill1 );
				expect( ramp.fgFill ).toBe( ramps[ 0 ].fgFill );
			}
		}
	);

	it( 'moves neighboring near-black seeds to the same nearby fill', () => {
		const neutral = buildBgRamp( '#fcfcfc' );
		for ( const seed of [ '#1d1d1d', '#1e1e1e' ] ) {
			const { ramp, warnings } = buildAccentRamp(
				'primary',
				seed,
				neutral
			);
			expect( warnings ).toBeUndefined();
			expect( ramp.bgFill1 ).toBe( '#2c2c2c' );
		}
	} );

	it( 'keeps a stroke target when gamut mapping lowers the searched color', () => {
		expect(
			buildAccentRamp( 'primary', '#ff0000', buildBgRamp( '#595959' ) )
				.warnings
		).toBeUndefined();
	} );

	it( 'keeps the forced brand surface tint on a dark background', () => {
		const { ramp } = buildAccentRamp(
			'primary',
			'#3858e9',
			buildBgRamp( '#222524' )
		);
		for ( const step of [ 'surface1', 'surface2', 'surface3' ] as const ) {
			expect( get( ramp[ step ], [ OKLCH, 'c' ] ) ).toBeGreaterThan(
				0.05
			);
		}
	} );

	it( 'retains a primary ramp that already meets the focus constraints', () => {
		const neutral = buildBgRamp( '#fcfcfc' );
		expect( buildAccentRamp( 'primary', '#3858e9', neutral ) ).toEqual(
			buildAccentRamp( 'info', '#3858e9', neutral )
		);
	} );

	it( 'keeps generated rings above 3:1 against neutral and brand surfaces', () => {
		for ( const background of [
			'#fcfcfc',
			'#1e1e1e',
			'#777777',
			'#608010',
		] ) {
			const neutral = buildBgRamp( background );
			for ( const primary of [
				'#3858e9',
				'#00ff00',
				'#ffff00',
				'#85767a',
			] ) {
				const { ramp } = buildAccentRamp( 'primary', primary, neutral );
				for ( const surface of [
					neutral.ramp.surface1,
					neutral.ramp.surface2,
					neutral.ramp.surface3,
					ramp.surface1,
				] ) {
					expect(
						getContrast( ramp.stroke3, surface )
					).toBeGreaterThanOrEqual( 3 );
				}
			}
		}
	} );
} );
