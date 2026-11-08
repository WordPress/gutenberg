import { contrastWCAG21, sRGB, type PlainColorObject } from 'colorjs.io/fn';
import { describe, expect, it } from 'vitest';
import { getContrast } from '../lib/color-utils';

describe( 'getContrast', () => {
	it.each( [
		[ '#000000', '#ffffff' ],
		[ '#3858e9', '#f6f7f7' ],
		[ '#1e1e1e', '#1e1e1e' ],
	] )( 'matches Color.js for string colors %s and %s', ( first, second ) => {
		const actual = getContrast( first, second );
		const expected = contrastWCAG21( first, second );

		expect( actual ).toBe( expected );
	} );

	it( 'matches Color.js for color objects', () => {
		const first: PlainColorObject = {
			space: sRGB,
			coords: [ 0.22, 0.35, 0.91 ],
			alpha: 1,
		};
		const second: PlainColorObject = {
			space: sRGB,
			coords: [ 0.96, 0.97, 0.97 ],
			alpha: 1,
		};

		const actual = getContrast( first, second );
		const expected = contrastWCAG21( first, second );

		expect( actual ).toBe( expected );
		expect( getContrast( first, second ) ).toBe( expected );
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
