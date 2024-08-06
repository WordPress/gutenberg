/**
 * Internal dependencies
 */
import compose from '../compose';

describe( 'compose', () => {
	it( 'returns the initial value if no functions are specified', () => {
		expect( compose()( 'test' ) ).toBe( 'test' );
	} );

	it( 'executes functions right-to-left when passed as separate arguments', () => {
		const a = ( value ) => ( value += 'a' );
		const b = ( value ) => ( value += 'b' );
		const c = ( value ) => ( value += 'c' );

		expect( compose( a, b, c )( 'test' ) ).toBe( 'testcba' );
	} );

	it( 'executes functions right-to-left when passed as a single array', () => {
		const a = ( value ) => ( value += 'a' );
		const b = ( value ) => ( value += 'b' );
		const c = ( value ) => ( value += 'c' );

		expect( compose( [ a, b, c ] )( 'test' ) ).toBe( 'testcba' );
	} );

	it( 'executes functions right-to-left when passed as a mix of separate arguments and arrays', () => {
		const a = ( value ) => ( value += 'a' );
		const b = ( value ) => ( value += 'b' );
		const c = ( value ) => ( value += 'c' );
		const d = ( value ) => ( value += 'd' );
		const e = ( value ) => ( value += 'e' );

		expect( compose( [ a, b ], c, [ d ], e )( 'test' ) ).toBe(
			'testedcba'
		);
	} );
} );
