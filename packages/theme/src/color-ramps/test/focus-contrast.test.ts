import { describe, expect, it } from 'vitest';
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
