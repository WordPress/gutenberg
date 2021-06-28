/**
 * Internal dependencies
 */
import { isValueNumeric } from '../values';

describe( 'isValueNumeric', () => {
	it( 'should return `true` for numeric values from various input types', () => {
		expect( isValueNumeric( '999' ) ).toBe( true );
		expect( isValueNumeric( '99.33' ) ).toBe( true );
		expect( isValueNumeric( 0.0003 ) ).toBe( true );
		expect( isValueNumeric( 2222 ) ).toBe( true );
		expect( isValueNumeric( '22,222,222' ) ).toBe( true );
		expect( isValueNumeric( -888 ) ).toBe( true );
		expect( isValueNumeric( new Number() ) ).toBe( true );
	} );

	it( 'should return `false` for non-numeric values from various input types', () => {
		expect( isValueNumeric( null ) ).toBe( false );
		expect( isValueNumeric() ).toBe( false );
		expect( isValueNumeric( 'Stringy' ) ).toBe( false );
		expect( isValueNumeric( {} ) ).toBe( false );
		expect( isValueNumeric( [] ) ).toBe( false );
	} );
} );
