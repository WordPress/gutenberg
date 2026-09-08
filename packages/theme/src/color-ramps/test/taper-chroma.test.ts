import { OKLCH, type PlainColorObject } from 'colorjs.io/fn';
import { describe, expect, it, vi } from 'vitest';
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

			expect( getTaperedChroma( seed, lightness ) ).toBeGreaterThan(
				0.001
			);
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

	it( 'returns the same tapered chroma regardless of cache population order', async () => {
		const target: PlainColorObject = {
			space: OKLCH,
			coords: [ 0.51, 0.12, 41 ],
			alpha: 1,
		};
		const unrelated: PlainColorObject = {
			space: OKLCH,
			coords: [ 0.52, 0.12, 44 ],
			alpha: 1,
		};

		vi.resetModules();
		const freshModule = await import( '../lib/taper-chroma' );
		const expected = freshModule.taperChroma( target, 0.71 );

		vi.resetModules();
		const pollutedModule = await import( '../lib/taper-chroma' );
		pollutedModule.taperChroma( unrelated, 0.72 );
		const actual = pollutedModule.taperChroma( target, 0.71 );

		expect( actual ).toEqual( expected );
	} );
} );
