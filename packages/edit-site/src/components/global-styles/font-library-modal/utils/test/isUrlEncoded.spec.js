/**
 * Internal dependencies
 */
import { isUrlEncoded } from '../index';

describe( 'isUrlEncoded', () => {
	// Test when input is not a string
	it( 'should return false if the input is not a string', () => {
		expect( isUrlEncoded( 123 ) ).toBe( false );
		expect( isUrlEncoded( null ) ).toBe( false );
		expect( isUrlEncoded( undefined ) ).toBe( false );
		expect( isUrlEncoded( {} ) ).toBe( false );
		expect( isUrlEncoded( [] ) ).toBe( false );
	} );

	// Test when URL is not encoded
	it( 'should return false for non-encoded URLs', () => {
		expect( isUrlEncoded( 'http://example.com' ) ).toBe( false );
		expect( isUrlEncoded( 'https://www.google.com' ) ).toBe( false );
		expect( isUrlEncoded( '/path/to/resource' ) ).toBe( false );
		expect( isUrlEncoded( '' ) ).toBe( false );
	} );

	// Test when URL is encoded
	it( 'should return true for encoded URLs', () => {
		expect( isUrlEncoded( 'http%3A%2F%2Fexample.com' ) ).toBe( true );
		expect( isUrlEncoded( 'https%3A%2F%2Fwww.google.com' ) ).toBe( true );
		expect( isUrlEncoded( '%2Fpath%2Fto%2Fresource' ) ).toBe( true );
		expect( isUrlEncoded( '%20' ) ).toBe( true );
	} );
} );
