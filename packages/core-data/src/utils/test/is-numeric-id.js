/**
 * Internal dependencies
 */
import isNumericID from '../is-numeric-id';

describe( 'isNumericID', () => {
	test.each( [
		[ true, '12345' ],
		[ true, '42' ],
		[ true, '   42   ' ],
		[ false, 'abc123' ],
		[ false, '123abc' ],
		[ false, '' ],
		[ false, '123-abc' ],
		[ false, 'abc-123' ],
		[ false, '42-test-123' ],
		[ true, 123 ],
	] )( `should return %s for input "%s"`, ( expected, input ) => {
		expect( isNumericID( input ) ).toBe( expected );
	} );
} );
