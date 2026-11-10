import { OKLCH, type PlainColorObject } from 'colorjs.io/fn';
import { describe, expect, it } from 'vitest';
import { taperChroma, type TaperChromaOptions } from '../lib/taper-chroma';

function getTaperedChroma(
	seed: PlainColorObject,
	lightness: number,
	options?: TaperChromaOptions
) {
	const result = taperChroma( seed, lightness, options );
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

	it( 'carries a near-gray tint in proportion to the seed chroma', () => {
		const getNearGrayChroma = ( chroma: number ) =>
			getTaperedChroma(
				{ space: OKLCH, coords: [ 0.99, chroma, 250 ], alpha: 1 },
				0.8
			);
		const chromas = [ 0.0005, 0.002, 0.0049, 0.0051 ].map(
			getNearGrayChroma
		);

		for ( let index = 1; index < chromas.length; index++ ) {
			expect( chromas[ index ] ).toBeGreaterThan( chromas[ index - 1 ] );
		}
		expect( chromas[ 0 ] ).toBeGreaterThan( 0 );
		expect( chromas[ 0 ] ).toBeLessThan( 0.0005 * 5 );
	} );

	it.each( [ 0.0005, 0.0045, 0.005 ] )(
		'keeps a faint tint close to seed chroma %s with the neutral ceiling',
		( chroma ) => {
			const seed: PlainColorObject = {
				space: OKLCH,
				coords: [ 0.93, chroma, 170 ],
				alpha: 1,
			};

			for ( const lightness of [ 0.2, 0.5, 0.8, 0.98 ] ) {
				const limited = getTaperedChroma( seed, lightness, {
					nearGrayChromaRatio: 1,
					nearGrayChroma: 0.02,
				} );

				expect( limited ).toBeGreaterThan( 0 );
				expect( limited ).toBeLessThanOrEqual( chroma * 1.0625 );
				expect( limited ).toBeLessThanOrEqual(
					getTaperedChroma( seed, lightness )
				);
			}
		}
	);

	it( 'releases the neutral ceiling for a richer seed', () => {
		const seed: PlainColorObject = {
			space: OKLCH,
			coords: [ 0.93, 0.05, 170 ],
			alpha: 1,
		};
		for ( const lightness of [ 0.2, 0.5, 0.8, 0.98 ] ) {
			expect(
				getTaperedChroma( seed, lightness, {
					nearGrayChromaRatio: 1,
					nearGrayChroma: 0.02,
				} )
			).toBe( getTaperedChroma( seed, lightness ) );
		}
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
