/**
 * Internal dependencies
 */
import { createElement } from '../react';
import { isEmptyElement, isPlainObject } from '../utils';

describe( 'isEmptyElement', () => {
	test( 'should be empty', () => {
		expect( isEmptyElement( undefined ) ).toBe( true );
		expect( isEmptyElement( false ) ).toBe( true );
		expect( isEmptyElement( '' ) ).toBe( true );
		expect( isEmptyElement( new String( '' ) ) ).toBe( true );
		expect( isEmptyElement( [] ) ).toBe( true );
	} );

	test( 'should not be empty', () => {
		expect( isEmptyElement( 0 ) ).toBe( false );
		expect( isEmptyElement( 100 ) ).toBe( false );
		expect( isEmptyElement( 'test' ) ).toBe( false );
		expect( isEmptyElement( createElement( 'div' ) ) ).toBe( false );
		expect( isEmptyElement( [ 'x' ] ) ).toBe( false );
	} );
} );

describe( 'isPlainObject', () => {
	test( 'should return true for plain objects', () => {
		expect( isPlainObject( { foo: 'bar' } ) ).toBe( true );
		expect( isPlainObject( new Object() ) ).toBe( true );
		expect( isPlainObject( Object.prototype ) ).toBe( true );
		expect( isPlainObject( Object.create( Object.prototype ) ) ).toBe(
			true
		);
		expect( isPlainObject( Object.create( null ) ) ).toBe( true );
	} );

	test( 'should return false for anything else', () => {
		expect( isPlainObject( undefined ) ).toBe( false );
		expect( isPlainObject( null ) ).toBe( false );
		expect( isPlainObject( true ) ).toBe( false );
		expect( isPlainObject( [ 1, 2, 3 ] ) ).toBe( false );
		expect( isPlainObject( '' ) ).toBe( false );
		expect( isPlainObject( 5 ) ).toBe( false );
		expect( isPlainObject( NaN ) ).toBe( false );
		expect( isPlainObject( Infinity ) ).toBe( false );
		expect( isPlainObject( new Array() ) ).toBe( false );
		expect( isPlainObject( new String( '' ) ) ).toBe( false );
		expect( isPlainObject( new Number( 5 ) ) ).toBe( false );
		expect( isPlainObject( /someRegex/ ) ).toBe( false );
		expect( isPlainObject( new Set( [ 1, 2, 3 ] ) ) ).toBe( false );
		expect( isPlainObject( function () {} ) ).toBe( false );
		expect( isPlainObject( () => {} ) ).toBe( false );
		expect(
			isPlainObject(
				new ( function () {
					return this;
				} )()
			)
		).toBe( false );
	} );
} );
