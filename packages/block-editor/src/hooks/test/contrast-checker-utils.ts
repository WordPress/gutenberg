import { describe, expect, it } from 'vitest';
import {
	getGradientStopColors,
	getLowestContrastColor,
} from '../contrast-checker-utils';

describe( 'contrast-checker-utils', () => {
	describe( 'getGradientStopColors()', () => {
		it( 'reads radial and repeating gradients and several layers', () => {
			expect(
				getGradientStopColors(
					'radial-gradient(rgb(0, 0, 0), rgb(1, 1, 1)), repeating-linear-gradient(rgb(2, 2, 2) 0px, rgb(3, 3, 3) 10px)'
				)
			).toEqual( [
				'rgb(0, 0, 0)',
				'rgb(1, 1, 1)',
				'rgb(2, 2, 2)',
				'rgb(3, 3, 3)',
			] );
		} );

		it.each( [
			[ 'url("https://example.com/a.jpg")' ],
			[ 'linear-gradient(color(display-p3 1 0 0), rgb(1, 1, 1))' ],
		] )( 'returns null for %s', ( value ) => {
			expect( getGradientStopColors( value ) ).toBeNull();
		} );
	} );

	describe( 'getLowestContrastColor()', () => {
		it( 'returns the opaque color with the lowest contrast against the backdrop', () => {
			expect(
				getLowestContrastColor(
					[
						'rgb(0, 0, 0)',
						'rgb(255, 255, 0)',
						'rgba(255, 255, 255, 0.5)',
					],
					'rgb(255, 255, 255)'
				)
			).toBe( 'rgb(255, 255, 0)' );
		} );
	} );
} );
