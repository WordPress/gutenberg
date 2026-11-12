import { describe, expect, it } from 'vitest';
import { getAverageGradientColor } from '../edit/gradient-utils';

describe( 'getAverageGradientColor', () => {
	it( 'averages two evenly placed stops', () => {
		expect(
			getAverageGradientColor(
				'linear-gradient(135deg, rgb(0, 0, 0) 0%, rgb(100, 200, 50) 100%)'
			)
		).toBe( 'rgb(50, 100, 25)' );
	} );

	it( 'weights stops by the distance they cover', () => {
		expect(
			getAverageGradientColor(
				'linear-gradient(rgb(0, 0, 0) 0%, rgb(255, 255, 255) 10%, rgb(255, 255, 255) 100%)'
			)
		).toBe( 'rgb(242, 242, 242)' );
	} );

	it( 'extends the first and last colors to the ends of the gradient', () => {
		expect(
			getAverageGradientColor(
				'linear-gradient(rgb(0, 0, 0) 40%, rgb(0, 0, 0) 50%, rgb(200, 200, 200) 50%, rgb(200, 200, 200) 60%)'
			)
		).toBe( 'rgb(100, 100, 100)' );
	} );

	it( 'spreads stops without a position evenly', () => {
		expect(
			getAverageGradientColor(
				'linear-gradient(rgb(0, 0, 0), rgb(100, 100, 100), rgb(200, 200, 200) 50%, rgb(200, 200, 200))'
			)
		).toBe( 'rgb(150, 150, 150)' );
	} );

	it( 'does not let positions go backwards', () => {
		expect(
			getAverageGradientColor(
				'linear-gradient(rgb(0, 0, 0) 50%, rgb(200, 200, 200) 10%)'
			)
		).toBe( 'rgb(100, 100, 100)' );
	} );

	it( 'does not let a transparent stop contribute its color', () => {
		expect(
			getAverageGradientColor(
				'linear-gradient(rgba(0, 0, 0, 0) 0%, rgb(255, 255, 255) 100%)'
			)
		).toBe( 'rgba(255, 255, 255, 0.5)' );
	} );

	it( 'reads a fully transparent gradient', () => {
		expect(
			getAverageGradientColor(
				'linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0))'
			)
		).toBe( 'rgba(0, 0, 0, 0)' );
	} );

	it( 'reads a radial gradient', () => {
		expect(
			getAverageGradientColor(
				'radial-gradient(rgb(0, 0, 0) 0%, rgb(100, 100, 100) 100%)'
			)
		).toBe( 'rgb(50, 50, 50)' );
	} );

	it.each( [
		[ 'no gradient', 'none' ],
		[ 'an image', 'url("https://example.org/image.png")' ],
		[
			'an image layer',
			'url("https://example.org/image.png"), linear-gradient(rgb(0, 0, 0), rgb(1, 1, 1))',
		],
		[
			'several gradients',
			'linear-gradient(rgb(0, 0, 0), rgb(1, 1, 1)), linear-gradient(rgb(2, 2, 2), rgb(3, 3, 3))',
		],
		[
			'a color it cannot read',
			'linear-gradient(oklch(0.5 0.1 200) 0%, rgb(0, 0, 0) 100%)',
		],
		[ 'currentcolor', 'linear-gradient(currentcolor, rgb(0, 0, 0))' ],
	] )( 'returns undefined for %s', ( _name, value ) => {
		expect( getAverageGradientColor( value ) ).toBeUndefined();
	} );
} );
