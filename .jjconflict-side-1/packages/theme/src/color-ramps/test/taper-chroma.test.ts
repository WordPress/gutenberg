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
