import { describe, expect, test } from 'vitest';
import { getGradientAstWithDefault } from '../utils';

describe( 'getGradientAstWithDefault', () => {
	describe( 'with a color interpolation method', () => {
		test( 'reads an interpolation method placed before the angle', () => {
			const { gradientAST, hasGradient } = getGradientAstWithDefault(
				'linear-gradient(in oklch 160deg, #009ED4 0%, #FFCE00 100%)'
			);

			expect( hasGradient ).toBe( true );
			expect( gradientAST.colorInterpolation ).toBe( 'in oklch' );
			expect( gradientAST.orientation ).toEqual( {
				type: 'angular',
				value: '160',
			} );
			expect( gradientAST.colorStops ).toHaveLength( 2 );
		} );

		test( 'reads an interpolation method placed after the direction', () => {
			const { gradientAST, hasGradient } = getGradientAstWithDefault(
				'linear-gradient(to right in oklab, #009ED4 0%, #FFCE00 100%)'
			);

			expect( hasGradient ).toBe( true );
			expect( gradientAST.colorInterpolation ).toBe( 'in oklab' );
			expect( gradientAST.orientation ).toEqual( {
				type: 'angular',
				value: '90',
			} );
		} );

		test( 'keeps the hue interpolation method of a polar color space', () => {
			const { gradientAST, hasGradient } = getGradientAstWithDefault(
				'linear-gradient(in oklch longer hue 160deg, #009ED4 0%, #FFCE00 100%)'
			);

			expect( hasGradient ).toBe( true );
			expect( gradientAST.colorInterpolation ).toBe(
				'in oklch longer hue'
			);
		} );

		test( 'falls back to the default gradient for an unknown color space', () => {
			const { gradientAST, hasGradient } = getGradientAstWithDefault(
				'linear-gradient(in not-a-space 160deg, #009ED4 0%, #FFCE00 100%)'
			);

			expect( console ).toHaveWarned();
			expect( hasGradient ).toBe( false );
			expect( gradientAST.colorInterpolation ).toBeUndefined();
		} );
	} );
} );
