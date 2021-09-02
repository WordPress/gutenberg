/**
 * Internal dependencies
 */
import { add, clamp, subtract, roundClamp } from '../math';

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

describe( 'roundClamp', () => {
	it( 'should clamp a value between min and max', () => {
		expect( roundClamp( 10, 1, 10 ) ).toBe( 10 );
		expect( roundClamp( 1, 1, 10 ) ).toBe( 1 );
		expect( roundClamp( 0, 1, 10 ) ).toBe( 1 );

		expect( roundClamp( 50, 1, 10 ) ).toBe( 10 );
		expect( roundClamp( 50, -10, 10 ) ).toBe( 10 );
		expect( roundClamp( -50, -10, 10 ) ).toBe( -10 );

		expect( roundClamp( '50', 1, 10 ) ).toBe( 10 );
		expect( roundClamp( '50', -10, 10 ) ).toBe( 10 );
		expect( roundClamp( -50, -10, '10' ) ).toBe( -10 );
	} );

	it( 'should clamp number or string values', () => {
		expect( roundClamp( '50', 1, 10 ) ).toBe( 10 );
		expect( roundClamp( '50', -10, 10 ) ).toBe( 10 );
		expect( roundClamp( -50, -10, '10' ) ).toBe( -10 );
	} );

	it( 'should clamp with step', () => {
		expect( roundClamp( 40, 0, 100, 10 ) ).toBe( 40 );
		expect( roundClamp( 42, 0, 100, 10 ) ).toBe( 40 );
		expect( roundClamp( 45, 0, 100, 10 ) ).toBe( 50 );
		expect( roundClamp( 49, 0, 100, 10 ) ).toBe( 50 );
		expect( roundClamp( 50, 0, 100, 10 ) ).toBe( 50 );

		expect( roundClamp( 50, 0, 100, 15 ) ).toBe( 45 );
		expect( roundClamp( 50, 0, 100, '15' ) ).toBe( 45 );
		expect( roundClamp( 50, 0, 100, 11 ) ).toBe( 55 );
	} );

	it( 'should clamp with float in step', () => {
		expect( roundClamp( 40, 1, 100, 1 ) ).toBe( 40 );
		expect( roundClamp( 40.5, 1, 100, 0.1 ) ).toBe( 40.5 );
		expect( roundClamp( 40.05, 1, 100, 0.01 ) ).toBe( 40.05 );
		expect( roundClamp( 40.06, 1, 100, 0.1 ) ).toBe( 40.1 );
		expect( roundClamp( 40.123005, 1, 100, 0.001 ) ).toBe( 40.123 );
	} );

	it( 'should round to steps starting from min', () => {
		expect( roundClamp( 10, 0.25, 100, 1 ) ).toBe( 10.25 );
		expect( roundClamp( 10, -20.25, 100, 1 ) ).toBe( 9.75 );
		expect( roundClamp( 10.5, 0.05, 100, 0.1 ) ).toBe( 10.45 );
		expect( roundClamp( 10.51, 0.05, 100, 0.1 ) ).toBe( 10.55 );
	} );

	it( 'should restrain max to a value that is a multiple of step starting from min', () => {
		expect( roundClamp( 10, 1, 10, 2 ) ).toBe( 9 );
		expect( roundClamp( 10.125, 0.1, 10, 0.125 ) ).toBe( 9.975 );
	} );

	it( 'should round with a precision that’s the greater of min and step', () => {
		expect( roundClamp( 10.061, 0.01, 20, 0.1 ) ).toBe( 10.11 );
		expect( roundClamp( 10.105, 0.1, 20, 0.01 ) ).toBe( 10.11 );
	} );
} );
