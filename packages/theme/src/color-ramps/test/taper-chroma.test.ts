import {
	ColorSpace,
	inGamut,
	OKLCH,
	P3,
	sRGB,
	type PlainColorObject,
} from 'colorjs.io/fn';
import { describe, expect, it } from 'vitest';
import { maxInGamutChromaAtLH, taperChroma } from '../lib/taper-chroma';

[ OKLCH, sRGB, P3 ].forEach( ( space ) => ColorSpace.register( space ) );

// Large enough to survive rounding in the conversion chain, small enough that
// no real gamut boundary lies within it.
const PROBE_OFFSET = 1e-6;

function isInGamut(
	l: number,
	c: number,
	h: number,
	space: ColorSpace = sRGB
): boolean {
	const color: PlainColorObject = {
		space: OKLCH,
		coords: [ l, c, h ],
		alpha: 1,
	};
	return inGamut( color, space, { epsilon: 1e-9 } );
}

function grid(): [ number, number ][] {
	const points: [ number, number ][] = [];
	for ( let l = 0.1; l <= 0.9; l += 0.1 ) {
		for ( let h = 0; h < 360; h += 10 ) {
			points.push( [ l, h ] );
		}
	}
	return points;
}

describe( 'maxInGamutChromaAtLH', () => {
	it( 'lands exactly on the gamut surface across the sRGB hue circle', () => {
		const misses = grid().filter( ( [ l, h ] ) => {
			const c = maxInGamutChromaAtLH( l, h, sRGB );
			return (
				! isInGamut( l, c - PROBE_OFFSET, h ) ||
				isInGamut( l, c + PROBE_OFFSET, h )
			);
		} );

		expect( misses ).toEqual( [] );
	} );

	it( 'leaves no in-gamut chroma beyond the boundary', () => {
		const misses = grid().filter( ( [ l, h ] ) => {
			const c = maxInGamutChromaAtLH( l, h, sRGB );
			for (
				let probe = c + PROBE_OFFSET;
				probe < c + 0.15;
				probe += 0.002
			) {
				if ( isInGamut( l, probe, h ) ) {
					return true;
				}
			}
			return false;
		} );

		expect( misses ).toEqual( [] );
	} );

	it( 'tracks a wider gamut, which admits at least as much chroma', () => {
		grid().forEach( ( [ l, h ] ) => {
			const inP3 = maxInGamutChromaAtLH( l, h, P3 );

			expect( inP3 ).toBeGreaterThanOrEqual(
				maxInGamutChromaAtLH( l, h, sRGB ) - PROBE_OFFSET
			);
			expect( isInGamut( l, inP3 - PROBE_OFFSET, h, P3 ) ).toBe( true );
			expect( isInGamut( l, inP3 + PROBE_OFFSET, h, P3 ) ).toBe( false );
		} );
	} );

	it( 'reproduces each sRGB primary at its own lightness and hue', () => {
		// A primary is a corner of the cube, so it is its own chroma ceiling.
		const primaries = [
			[ 0.45201371817442365, 264.0520226163699, 0.3132143886344849 ],
			[ 0.6279553639214311, 29.23388027962784, 0.2576833038053608 ],
			[ 0.8664396175234368, 142.4953450414439, 0.2948272245426958 ],
		];

		primaries.forEach( ( [ l, h, chroma ] ) => {
			expect( maxInGamutChromaAtLH( l, h, sRGB ) ).toBeCloseTo(
				chroma,
				9
			);
		} );
	} );

	it( 'admits no chroma at either end of the lightness axis', () => {
		expect( maxInGamutChromaAtLH( 0, 264, sRGB ) ).toBe( 0 );
		expect( maxInGamutChromaAtLH( 1, 264, sRGB ) ).toBe( 0 );
	} );

	it( 'rejects a gamut that is not an RGB space', () => {
		expect( () => maxInGamutChromaAtLH( 0.5, 264, OKLCH ) ).toThrow(
			/expected an RGB color space/
		);
	} );
} );

describe( 'taperChroma', () => {
	it( 'never plans a chroma outside the gamut', () => {
		const seed: PlainColorObject = {
			space: OKLCH,
			coords: [ 0.51, 0.12, 41 ],
			alpha: 1,
		};

		for ( let lTarget = 0.05; lTarget <= 0.95; lTarget += 0.05 ) {
			const tapered = taperChroma( seed, lTarget );

			expect( 'c' in tapered ).toBe( true );
			if ( 'c' in tapered ) {
				expect( isInGamut( tapered.l, tapered.c, 41 ) ).toBe( true );
			}
		}
	} );

	it( 'stays achromatic for an achromatic seed', () => {
		const seed: PlainColorObject = {
			space: OKLCH,
			coords: [ 0.51, 0, 0 ],
			alpha: 1,
		};

		expect( taperChroma( seed, 0.71 ) ).toEqual( {
			space: OKLCH,
			coords: [ 0.71, 0, 0 ],
			alpha: 1,
		} );
	} );
} );
