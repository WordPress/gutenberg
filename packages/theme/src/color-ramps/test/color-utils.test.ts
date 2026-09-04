import {
	ColorSpace,
	contrastWCAG21,
	sRGB,
	type PlainColorObject,
} from 'colorjs.io/fn';
import { beforeAll, describe, expect, it } from 'vitest';
import { getContrast } from '../lib/color-utils';

describe( 'getContrast', () => {
	beforeAll( () => ColorSpace.register( sRGB ) );

	it.each( [
		[ '#000000', '#ffffff' ],
		[ '#3858e9', '#f6f7f7' ],
		[ '#1e1e1e', '#1e1e1e' ],
	] )( 'matches Color.js for string colors %s and %s', ( first, second ) => {
		const expected = contrastWCAG21( first, second );

		expect( getContrast( first, second ) ).toBe( expected );
		expect( getContrast( first, second ) ).toBe( expected );
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

		const expected = contrastWCAG21( first, second );

		expect( getContrast( first, second ) ).toBe( expected );
		expect( getContrast( first, second ) ).toBe( expected );
	} );
} );
