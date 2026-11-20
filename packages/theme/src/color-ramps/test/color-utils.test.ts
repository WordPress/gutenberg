import { sRGB, type PlainColorObject } from 'colorjs.io/fn';
import { describe, expect, it } from 'vitest';
import { getContrast } from '../lib/color-utils';

describe( 'getContrast', () => {
	it.each( [
		[ '#000000', '#ffffff', 21 ],
		[ '#ff0000', '#000000', 5.252 ],
		[ '#00ff00', '#000000', 15.304 ],
		[ '#0000ff', '#000000', 2.444 ],
		[ '#4569fb', '#ffffff', 4.4999882584708395 ],
	] )(
		'uses the WCAG sRGB formula for %s and %s',
		( first, second, expected ) => {
			expect( getContrast( first, second ) ).toBeCloseTo( expected, 10 );
		}
	);

	it( 'uses the same WCAG formula for cached color objects', () => {
		const first: PlainColorObject = {
			space: sRGB,
			coords: [ 1, 0, 0 ],
			alpha: 1,
		};
		const second: PlainColorObject = {
			space: sRGB,
			coords: [ 0, 0, 0 ],
			alpha: 1,
		};

		const actual = getContrast( first, second );
		expect( actual ).toBeCloseTo( 5.252, 10 );
		expect( getContrast( first, second ) ).toBe( actual );
	} );

	it( 'recalculates contrast after a color object is mutated', () => {
		const mutableColor: PlainColorObject = {
			space: sRGB,
			coords: [ 0, 0, 0 ],
			alpha: 1,
		};
		const white: PlainColorObject = {
			space: sRGB,
			coords: [ 1, 1, 1 ],
			alpha: 1,
		};

		expect( getContrast( mutableColor, white ) ).toBe( 21 );
		mutableColor.coords[ 0 ] = 1;
		mutableColor.coords[ 1 ] = 1;
		mutableColor.coords[ 2 ] = 1;
		expect( getContrast( mutableColor, white ) ).toBe( 1 );
	} );
} );
