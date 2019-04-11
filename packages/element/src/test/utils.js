/**
 * Internal dependencies
 */
import { createElement } from '../react';
import { isEmptyElement } from '../utils';

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
