/**
 * Internal dependencies
 */
import { add, decimalClamp, subtract, roundClamp } from '../math';

describe( 'add', () => {
	it( 'should add string and number values', () => {
		expect( add( '105', '30' ) ).toBe( 135 );
		expect( add( 105, 30 ) ).toBe( 135 );
		expect( add( '105', 30 ) ).toBe( 135 );
		expect( add( 105, '30' ) ).toBe( 135 );

		// Negative values
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

		// Negative values
		expect( subtract( 100, '-30' ) ).toBe( 130 );
		expect( subtract( -100, '-30' ) ).toBe( -70 );
	} );

	it( 'should subtract multiple arguments', () => {
		expect( subtract( '105', '30', 10, 5 ) ).toBe( 60 );
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
		expect( roundClamp( 40, 1, 100, 10 ) ).toBe( 40 );
		expect( roundClamp( 42, 1, 100, 10 ) ).toBe( 40 );
		expect( roundClamp( 45, 1, 100, 10 ) ).toBe( 50 );
		expect( roundClamp( 49, 1, 100, 10 ) ).toBe( 50 );
		expect( roundClamp( 50, 1, 100, 10 ) ).toBe( 50 );

		expect( roundClamp( 50, 1, 100, 15 ) ).toBe( 45 );
		expect( roundClamp( 50, 1, 100, '15' ) ).toBe( 45 );
		expect( roundClamp( 50, 1, 100, 11 ) ).toBe( 55 );
	} );

	it( 'should clamp with float in step', () => {
		expect( roundClamp( 40, 1, 100, 1 ) ).toBe( 40 );
		expect( roundClamp( 40.5, 1, 100, 0.1 ) ).toBe( 40.5 );
		expect( roundClamp( 40.05, 1, 100, 0.01 ) ).toBe( 40.05 );
		expect( roundClamp( 40.06, 1, 100, 0.1 ) ).toBe( 40.1 );
		expect( roundClamp( 40.123005, 1, 100, 0.001 ) ).toBe( 40.123 );
	} );
} );

describe( 'decimalClamp', () => {
	it( 'should clamp a value between min and max', () => {
		expect( decimalClamp( 10, 1, 10 ) ).toBe( 10 );
		expect( decimalClamp( 1, 1, 10 ) ).toBe( 1 );
		expect( decimalClamp( 0, 1, 10 ) ).toBe( 1 );

		expect( decimalClamp( 50, 1, 10 ) ).toBe( 10 );
		expect( decimalClamp( 50, -10, 10 ) ).toBe( 10 );
		expect( decimalClamp( -50, -10, 10 ) ).toBe( -10 );

		expect( decimalClamp( '50', 1, 10 ) ).toBe( 10 );
		expect( decimalClamp( '50', -10, 10 ) ).toBe( 10 );
		expect( decimalClamp( -50, -10, '10' ) ).toBe( -10 );
	} );

	it( 'should clamp number or string values', () => {
		expect( decimalClamp( '50', 1, 10 ) ).toBe( 10 );
		expect( decimalClamp( '50', -10, 10 ) ).toBe( 10 );
		expect( decimalClamp( -50, -10, '10' ) ).toBe( -10 );
	} );

	it( 'should allow decimal values without steps rounded to 5 places', () => {
		expect( decimalClamp( 3.12345, 1, 10 ) ).toBe( 3.12345 );
		expect( decimalClamp( -2.12, -10, 10 ) ).toBe( -2.12 );
		expect( decimalClamp( 25.1234567, 0, 30 ) ).toBe( 25.12346 );
	} );

	it( 'should allow specifying a custom precision', () => {
		expect( decimalClamp( 3.12345, 1, 10, 2 ) ).toBe( 3.12 );
		expect( decimalClamp( -2.12, -10, 10, 1 ) ).toBe( -2.1 );
		expect( decimalClamp( 25.123456789, 0, 30, 9 ) ).toBe( 25.123456789 );
	} );
} );
