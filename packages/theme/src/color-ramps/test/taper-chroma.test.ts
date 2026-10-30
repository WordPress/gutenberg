import { OKLCH, type PlainColorObject } from 'colorjs.io/fn';
import { describe, expect, it } from 'vitest';
import { taperChroma } from '../lib/taper-chroma';

function getTaperedChroma( seed: PlainColorObject, lightness: number ) {
	const result = taperChroma( seed, lightness );
	if ( ! ( 'c' in result ) ) {
		throw new Error( 'Expected a chromatic taper result.' );
	}
	return result.c;
}

describe( 'taperChroma', () => {
	it.each( [ 0.02, 0.98 ] )(
		'preserves chroma near the %s lightness boundary',
		( lightness ) => {
			const seed: PlainColorObject = {
				space: OKLCH,
				coords: [ 0.6, 0.2, 250 ],
				alpha: 1,
			};

			expect( getTaperedChroma( seed, lightness ) ).toBeGreaterThan( 0 );
		}
	);

	it( 'carries a near-gray tint without a cut-off at the achromatic threshold', () => {
		const getNearGrayChroma = ( chroma: number ) =>
			getTaperedChroma(
				{ space: OKLCH, coords: [ 0.26, chroma, 170 ], alpha: 1 },
				0.3
			);
		const belowThreshold = getNearGrayChroma( 0.0049 );
		const aboveThreshold = getNearGrayChroma( 0.0051 );

		expect( belowThreshold ).toBeGreaterThan( 0 );
		expect( aboveThreshold - belowThreshold ).toBeLessThan( 0.001 );
	} );

	it( 'keeps a gray seed gray', () => {
		const result = taperChroma(
			{ space: OKLCH, coords: [ 0.26, 0, NaN ], alpha: 1 },
			0.3
		);

		expect( 'c' in result ? result.c : result.coords[ 1 ] ).toBe( 0 );
	} );

	it( 'reduces chroma gradually near the white lightness boundary', () => {
		const seed: PlainColorObject = {
			space: OKLCH,
			coords: [ 0.6, 0.2, 250 ],
			alpha: 1,
		};
		const chromas = [ 0.97, 0.98, 0.99, 1 ].map( ( lightness ) =>
			getTaperedChroma( seed, lightness )
		);

		for ( let index = 1; index < chromas.length; index++ ) {
			expect( chromas[ index - 1 ] ).toBeGreaterThan( chromas[ index ] );
		}
	} );
} );
