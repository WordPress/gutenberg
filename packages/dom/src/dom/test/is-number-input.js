/**
 * Internal dependencies
 */
import isNumberInput from '../is-number-input';

describe( 'isNumberInput', () => {
	it( 'should handle zero value properly', () => {
		const input = document.createElement( 'input' );
		input.type = 'number';
		input.value = 0;
		expect( isNumberInput( input ) ).toBe( true );
	} );
} );
