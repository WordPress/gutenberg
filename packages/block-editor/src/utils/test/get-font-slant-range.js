import { describe, expect, it } from 'vitest';
import {
	getDefaultObliqueAngle,
	getFontSlantRange,
} from '../get-font-slant-range';

describe( 'getFontSlantRange', () => {
	it( 'reads a two-angle descriptor', () => {
		/*
		 * Roboto Flex, whose `slnt` axis runs -10 to 0. CSS takes the angle
		 * with the sign flipped, so the face declares 0 to 10.
		 */
		expect(
			getFontSlantRange( [ { fontStyle: 'oblique 0deg 10deg' } ] )
		).toEqual( { min: 0, max: 10 } );
	} );

	it( 'reads a single angle as a range of one', () => {
		expect(
			getFontSlantRange( [ { fontStyle: 'oblique 12deg' } ] )
		).toEqual( { min: 12, max: 12 } );
	} );

	it( 'reads a bare oblique as the angle the property means by it', () => {
		expect( getFontSlantRange( [ { fontStyle: 'oblique' } ] ) ).toEqual( {
			min: 14,
			max: 14,
		} );
	} );

	it( 'orders a reversed range and spans several faces', () => {
		expect(
			getFontSlantRange( [
				{ fontStyle: 'oblique 20deg 5deg' },
				{ fontStyle: 'oblique -4deg 2deg' },
			] )
		).toEqual( { min: -4, max: 20 } );
	} );

	it( 'ignores faces that are not oblique', () => {
		expect(
			getFontSlantRange( [
				{ fontStyle: 'normal' },
				{ fontStyle: 'italic' },
			] )
		).toBeUndefined();
		expect( getFontSlantRange( undefined ) ).toBeUndefined();
	} );
} );

describe( 'getDefaultObliqueAngle', () => {
	it( 'starts at the angle CSS means by a bare oblique', () => {
		expect( getDefaultObliqueAngle( { min: 0, max: 20 } ) ).toBe( 14 );
	} );

	it( 'keeps that angle inside what the face can draw', () => {
		// Roboto Flex stops at 10deg, so a bare `oblique` would ask for more
		// slant than the axis has.
		expect( getDefaultObliqueAngle( { min: 0, max: 10 } ) ).toBe( 10 );
		expect( getDefaultObliqueAngle( { min: 16, max: 30 } ) ).toBe( 16 );
	} );
} );
