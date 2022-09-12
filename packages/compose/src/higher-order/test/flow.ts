/**
 * Internal dependencies
 */
import flow from '../flow';

describe( 'flow', () => {
	it( 'returns the initial value if no functions are specified', () => {
		expect( flow()( 'test' ) ).toBe( 'test' );
	} );

	it( 'executes functions left-to-right when passed as separate arguments', () => {
		const a = ( value ) => ( value += 'a' );
		const b = ( value ) => ( value += 'b' );
		const c = ( value ) => ( value += 'c' );

		expect( flow( a, b, c )( 'test' ) ).toBe( 'testabc' );
	} );

	it( 'executes functions left-to-right when passed as a single array', () => {
		const a = ( value ) => ( value += 'a' );
		const b = ( value ) => ( value += 'b' );
		const c = ( value ) => ( value += 'c' );

		expect( flow( [ a, b, c ] )( 'test' ) ).toBe( 'testabc' );
	} );

	it( 'executes functions left-to-right when passed as a mix of separate arguments and arrays', () => {
		const a = ( value ) => ( value += 'a' );
		const b = ( value ) => ( value += 'b' );
		const c = ( value ) => ( value += 'c' );
		const d = ( value ) => ( value += 'd' );
		const e = ( value ) => ( value += 'e' );
		const f = ( value ) => ( value += 'f' );

		expect( flow( [ a, b ], c, [ d ], e )( 'test' ) ).toBe( 'testabcde' );
	} );
} );
