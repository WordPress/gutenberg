import { describe, expect, it } from 'vitest';
import { get, OKLCH } from 'colorjs.io/fn';
import { buildAccentRamp, buildBgRamp, buildPrimaryRamp } from '..';
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
			const { ramp, warnings } = buildPrimaryRamp( primary, neutral );
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

	it( 'retains a primary ramp that already meets the focus constraints', () => {
		const neutral = buildBgRamp( '#fcfcfc' );
		expect( buildPrimaryRamp( '#3858e9', neutral ) ).toEqual(
			buildAccentRamp( '#3858e9', neutral )
		);
	} );

	it( 'carries a saturated background through the neighboring surfaces', () => {
		const { ramp } = buildBgRamp( '#cc4541' );
		const seedChroma = get( ramp.surface2, [ OKLCH, 'c' ] );
		for ( const step of [ 'surface1', 'surface3' ] as const ) {
			const ratio = get( ramp[ step ], [ OKLCH, 'c' ] ) / seedChroma;
			expect( ratio ).toBeGreaterThan( 0.9 );
			expect( ratio ).toBeLessThan( 1.1 );
		}
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
				const { ramp } = buildAccentRamp( primary, neutral );
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
