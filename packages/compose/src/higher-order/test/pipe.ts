import { describe, expect, it } from 'vitest';
import pipe from '../pipe';

describe( 'pipe', () => {
	it( 'returns the initial value if no functions are specified', () => {
		expect( pipe()( 'test' ) ).toBe( 'test' );
	} );

	it( 'executes functions left-to-right when passed as separate arguments', () => {
		const a = ( value: string ) => ( value += 'a' );
		const b = ( value: string ) => ( value += 'b' );
		const c = ( value: string ) => ( value += 'c' );

		expect( pipe( a, b, c )( 'test' ) ).toBe( 'testabc' );
	} );

	it( 'executes functions left-to-right when passed as a single array', () => {
		const a = ( value: string ) => ( value += 'a' );
		const b = ( value: string ) => ( value += 'b' );
		const c = ( value: string ) => ( value += 'c' );

		expect( pipe( [ a, b, c ] )( 'test' ) ).toBe( 'testabc' );
	} );

	it( 'executes functions left-to-right when passed as a mix of separate arguments and arrays', () => {
		const a = ( value: string ) => ( value += 'a' );
		const b = ( value: string ) => ( value += 'b' );
		const c = ( value: string ) => ( value += 'c' );
		const d = ( value: string ) => ( value += 'd' );
		const e = ( value: string ) => ( value += 'e' );

		expect( pipe( [ a, b ], c, [ d ], e )( 'test' ) ).toBe( 'testabcde' );
	} );
} );
