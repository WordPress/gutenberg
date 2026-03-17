/**
 * Internal dependencies
 */

import { add, subtract, clamp, ensureValidStep } from '../math';

describe( 'add', () => {
	it( 'should add string and number values', () => {
		expect( add( '105', '30' ) ).toBe( 135 );
		expect( add( 105, 30 ) ).toBe( 135 );
		expect( add( '105', 30 ) ).toBe( 135 );
		expect( add( 105, '30' ) ).toBe( 135 );

		// Negative values.
		expect( add( 100, '-30' ) ).toBe( 70 );
		expect( add( -100, '-30' ) ).toBe( -130 );
	} );

	it( 'should add multiple arguments', () => {
		expect( add( '105', '30', 10, 5 ) ).toBe( 150 );
	} );
} );

describe( 'subtract', () => {
	it( 'should subtract string and number values', () => {
		expect( subtract( '105', '30' ) ).toBe( 75 );
		expect( subtract( 105, 30 ) ).toBe( 75 );
		expect( subtract( '105', 30 ) ).toBe( 75 );
		expect( subtract( 105, '30' ) ).toBe( 75 );

		// Negative values.
		expect( subtract( 100, '-30' ) ).toBe( 130 );
		expect( subtract( -100, '-30' ) ).toBe( -70 );
	} );

	it( 'should subtract multiple arguments', () => {
		expect( subtract( '105', '30', 10, 5 ) ).toBe( 60 );
	} );
} );

describe( 'clamp', () => {
	it( 'should clamp a value between min and max', () => {
		expect( clamp( 10, 1, 10 ) ).toBe( 10 );
		expect( clamp( 1, 1, 10 ) ).toBe( 1 );
		expect( clamp( 0, 1, 10 ) ).toBe( 1 );

		expect( clamp( 50, 1, 10 ) ).toBe( 10 );
		expect( clamp( 50, -10, 10 ) ).toBe( 10 );
		expect( clamp( -50, -10, 10 ) ).toBe( -10 );

		expect( clamp( Infinity, -10, 10 ) ).toBe( 10 );
		expect( clamp( -Infinity, -10, 10 ) ).toBe( -10 );
	} );

	it( 'should clamp number or string values', () => {
		expect( clamp( '50', 1, 10 ) ).toBe( 10 );
		expect( clamp( '50', -10, 10 ) ).toBe( 10 );
		expect( clamp( -50, -10, '10' ) ).toBe( -10 );
	} );
} );

describe( 'ensureValidStep', () => {
	it( 'should work with number or string values', () => {
		expect( ensureValidStep( '49', 0, 10 ) ).toBe( 50 );
		expect( ensureValidStep( 49, '0', 10 ) ).toBe( 50 );
		expect( ensureValidStep( 49, 0, '10' ) ).toBe( 50 );
	} );

	it( 'should round to step', () => {
		expect( ensureValidStep( 40, 0, 10 ) ).toBe( 40 );
		expect( ensureValidStep( 42, 0, 10 ) ).toBe( 40 );
		expect( ensureValidStep( 45, 0, 10 ) ).toBe( 50 );
		expect( ensureValidStep( 49, 0, 10 ) ).toBe( 50 );

		expect( ensureValidStep( 50, 0, 15 ) ).toBe( 45 );
		expect( ensureValidStep( 50, 0, 11 ) ).toBe( 55 );
	} );

	it( 'should round with float in step', () => {
		expect( ensureValidStep( 40.5, 1, 0.1 ) ).toBe( 40.5 );
		expect( ensureValidStep( 40.05, 1, 0.01 ) ).toBe( 40.05 );
		expect( ensureValidStep( 40.06, 1, 0.1 ) ).toBe( 40.1 );
		expect( ensureValidStep( 40.123005, 1, 0.001 ) ).toBe( 40.123 );
	} );

	it( 'should round to steps starting from min', () => {
		expect( ensureValidStep( 10, 0.25, 1 ) ).toBe( 10.25 );
		expect( ensureValidStep( 10, -20.25, 1 ) ).toBe( 9.75 );
		expect( ensureValidStep( 10.5, 0.05, 0.1 ) ).toBe( 10.45 );
		expect( ensureValidStep( 10.51, 0.05, 0.1 ) ).toBe( 10.55 );
	} );

	it( 'should round with a precision that’s the greater of min and step', () => {
		expect( ensureValidStep( 10.061, 0.01, 0.1 ) ).toBe( 10.11 );
		expect( ensureValidStep( 10.105, 0.1, 0.01 ) ).toBe( 10.11 );
	} );
} );
