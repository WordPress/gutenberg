/**
 * Internal dependencies
 */
import { removeNonDigit, toFixed } from '../';

describe( 'removeNonDigit', () => {
	it( 'function returns empty string if passed text does not contain digit characters', () => {
		const result = removeNonDigit( 'test' );
		expect( result ).toBe( '' );
	} );

	it( 'function removes non digit characters from passed text', () => {
		const result = removeNonDigit( 'test123' );
		expect( result ).toBe( '123' );
	} );

	it( 'function accepts dot character', () => {
		const result = removeNonDigit( '12.34', 2 );
		expect( result ).toBe( '12.34' );
	} );

	it( 'function accepts comma character', () => {
		const result = removeNonDigit( '12,34', 2 );
		expect( result ).toBe( '12,34' );
	} );
} );

describe( 'toFixed', () => {
	it( 'function returns the passed number if `decimalNum` is not specified', () => {
		const result = toFixed( '123' );
		expect( result ).toBe( 123 );
	} );

	it( 'function returns the number without decimals if `decimalNum` is not specified', () => {
		const result = toFixed( '123.4567' );
		expect( result ).toBe( 123 );
	} );

	it( 'function returns the number applying `decimalNum`', () => {
		const result = toFixed( '123.4567', 2 );
		expect( result ).toBe( 123.45 );
	} );

	it( 'function returns number without decimals if `decimalNum` is negative', () => {
		const result = toFixed( '12.34', -12 );
		expect( result ).toBe( 12 );
	} );
} );
