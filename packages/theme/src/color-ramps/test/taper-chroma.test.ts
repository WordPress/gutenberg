import { OKLCH, type PlainColorObject } from 'colorjs.io/fn';
import { describe, expect, it, vi } from 'vitest';

describe( 'taperChroma', () => {
	it( 'returns the same tapered chroma for exact inputs that share a rounded cache bucket', async () => {
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
