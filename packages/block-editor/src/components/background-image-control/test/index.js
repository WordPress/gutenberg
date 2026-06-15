/**
 * Internal dependencies
 */

import { backgroundPositionToCoords, coordsToBackgroundPosition } from '../';

describe( 'backgroundPositionToCoords', () => {
	it( 'should return the correct coordinates for a percentage value using 2-value syntax', () => {
		expect( backgroundPositionToCoords( '25% 75%' ) ).toEqual( {
			x: 0.25,
			y: 0.75,
		} );
	} );

	it( 'should return the correct coordinates for a percentage using 1-value syntax', () => {
		expect( backgroundPositionToCoords( '50%' ) ).toEqual( {
			x: 0.5,
			y: 0.5,
		} );
	} );

	it( 'should return undefined coords in given an empty value', () => {
		expect( backgroundPositionToCoords( '' ) ).toEqual( {
			x: undefined,
			y: undefined,
		} );
	} );

	it( 'should return undefined coords in given a string that cannot be converted', () => {
		expect( backgroundPositionToCoords( 'apples' ) ).toEqual( {
			x: undefined,
			y: undefined,
		} );
	} );
} );

describe( 'coordsToBackgroundPosition', () => {
	it( 'should return the correct background position for a set of coordinates', () => {
		expect( coordsToBackgroundPosition( { x: 0.25, y: 0.75 } ) ).toBe(
			'25% 75%'
		);
	} );

	it( 'should return undefined if no coordinates are provided', () => {
		expect( coordsToBackgroundPosition( {} ) ).toBeUndefined();
	} );
} );
