/**
 * Internal dependencies
 */
import { interpolate, interpolateRounded } from '../interpolate';

describe( 'interpolate', () => {
	it( 'should work with defaults', () => {
		// Defaults to input: 0, inputRange: [ 0, 1 ], outputRange: [ 0, 1 ]
		expect( interpolate( -1 ) ).toBe( 0 );
		expect( interpolate() ).toBe( 0 );
		expect( interpolate( 0.5 ) ).toBe( 0.5 );
		expect( interpolate( 1 ) ).toBe( 1 );
		expect( interpolate( 10 ) ).toBe( 1 );
	} );

	it( 'should handle single value output range', () => {
		expect( interpolate( 0.5, [ 0, 1 ], [ 100, 100 ] ) ).toBe( 100 );
	} );

	it( 'should handle single value input range', () => {
		const inputRange: [ number, number ] = [ 1, 1 ];
		const outputRange: [ number, number ] = [ 100, 200 ];

		expect( interpolate( 1, inputRange, outputRange ) ).toBe( 100 );
		expect( interpolate( 5, inputRange, outputRange ) ).toBe( 200 );
	} );

	it( 'should correctly map values within input range', () => {
		const inputRange: [ number, number ] = [ 0, 100 ];
		const outputRange: [ number, number ] = [ 0, 1 ];

		expect( interpolate( 0, inputRange, outputRange ) ).toBe( 0 );
		expect( interpolate( 10, inputRange, outputRange ) ).toBe( 0.1 );
		expect( interpolate( 50, inputRange, outputRange ) ).toBe( 0.5 );
		expect( interpolate( 100, inputRange, outputRange ) ).toBe( 1 );
	} );

	it( 'should clamp values outside input range', () => {
		const inputRange: [ number, number ] = [ 10, 50 ];
		const outputRange: [ number, number ] = [ 0, 1 ];

		expect( interpolate( -1, inputRange, outputRange ) ).toBe( 0 );
		expect( interpolate( 0, inputRange, outputRange ) ).toBe( 0 );
		expect( interpolate( 5, inputRange, outputRange ) ).toBe( 0 );
		expect( interpolate( 51, inputRange, outputRange ) ).toBe( 1 );
		expect( interpolate( 100, inputRange, outputRange ) ).toBe( 1 );
	} );

	it( 'should return original valid input if both ranges match', () => {
		expect( interpolate( 1, [ 0, 100 ], [ 0, 100 ] ) ).toBe( 1 );
		expect( interpolate( -10, [ -100, -1 ], [ -100, -1 ] ) ).toBe( -10 );
	} );

	it( 'should map negative ranges and values', () => {
		expect( interpolate( -75, [ -100, -50 ], [ 0, 100 ] ) ).toBe( 50 );
		expect( interpolate( -60, [ -100, -50 ], [ -50, -10 ] ) ).toBe( -18 );
		expect( interpolate( 75, [ 0, 100 ], [ -100, -50 ] ) ).toBe( -62.5 );
		expect( interpolate( 33, [ 0, 100 ], [ -100, -50 ] ) ).toBe( -83.5 );
		expect( interpolate( 25, [ 0, 100 ], [ -100, 100 ] ) ).toBe( -50 );
		expect( interpolate( 75, [ 0, 100 ], [ -100, 100 ] ) ).toBe( 50 );
	} );

	it( 'should handle input range with -Infinity minimum', () => {
		const inputRange: [ number, number ] = [ -Infinity, 0 ];

		expect( interpolate( -1000, inputRange, [ -Infinity, 1000 ] ) ).toBe(
			-1000
		);
		expect(
			interpolate( -Infinity, inputRange, [ -Infinity, 1000 ] )
		).toBe( -Infinity );
		expect( interpolate( 0, inputRange, [ 1, Infinity ] ) ).toBe( 1 );
		expect( interpolate( -25, inputRange, [ 100, Infinity ] ) ).toBe( 125 );
		expect( interpolate( -5, inputRange, [ 1000, 2000 ] ) ).toBe( 2000 );
	} );

	it( 'should handle input range with Infinity maximum', () => {
		const inputRange: [ number, number ] = [ 0, Infinity ];

		expect( interpolate( 1000, inputRange, [ -Infinity, 1000 ] ) ).toBe(
			-1000
		);
		expect( interpolate( Infinity, inputRange, [ -Infinity, 1000 ] ) ).toBe(
			-Infinity
		);
		expect( interpolate( 0, inputRange, [ 1, Infinity ] ) ).toBe( 1 );
		expect( interpolate( 25, inputRange, [ 100, Infinity ] ) ).toBe( 125 );
		expect( interpolate( 5, inputRange, [ 1000, 2000 ] ) ).toBe( 2000 );
	} );

	it( 'should handle reversed output range', () => {
		expect( interpolate( 50, [ 0, 100 ], [ 60, 30 ] ) ).toBe( 45 );
		expect( interpolate( 500, [ 0, 100 ], [ 60, 30 ] ) ).toBe( 30 );
		expect( interpolate( -100, [ 0, 100 ], [ 60, 30 ] ) ).toBe( 60 );
	} );
} );

describe( 'interpolateRounded', () => {
	it( 'should round interpolated values', () => {
		const rawValue = interpolate( 1, [ 0, 3 ], [ 0, 100 ] ); // 33.3333...
		const value = Math.round( rawValue ); // 33
		expect( interpolateRounded( 1, [ 0, 3 ], [ 0, 100 ] ) ).toBe( value );
	} );
} );
