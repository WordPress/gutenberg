import { describe, expect, it } from 'vitest';
import { get, OKLCH } from 'colorjs.io/fn';
import { buildBgRamp } from '..';

describe( 'saturated backgrounds', () => {
	it.each( [ '#cc4541', '#3876a8' ] )(
		'carries the saturation of %s into surfaces and dividers',
		( background ) => {
			const { ramp } = buildBgRamp( background );
			const seedChroma = get( ramp.surface2, [ OKLCH, 'c' ] );
			for ( const step of [ 'surface1', 'surface3' ] as const ) {
				const ratio = get( ramp[ step ], [ OKLCH, 'c' ] ) / seedChroma;
				expect( ratio ).toBeGreaterThan( 0.9 );
				expect( ratio ).toBeLessThan( 1.1 );
			}
			expect(
				get( ramp.stroke1, [ OKLCH, 'c' ] ) / seedChroma
			).toBeGreaterThan( 0.8 );
		}
	);
} );
