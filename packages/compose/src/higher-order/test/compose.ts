import { describe, expect, it } from 'vitest';
import compose from '../compose';

describe( 'compose', () => {
	it( 'returns the initial value if no functions are specified', () => {
		expect( compose()( 'test' ) ).toBe( 'test' );
	} );

	it( 'executes functions right-to-left when passed as separate arguments', () => {
		const a = ( value: string ) => ( value += 'a' );
		const b = ( value: string ) => ( value += 'b' );
		const c = ( value: string ) => ( value += 'c' );

		expect( compose( a, b, c )( 'test' ) ).toBe( 'testcba' );
	} );

	it( 'executes functions right-to-left when passed as a single array', () => {
		const a = ( value: string ) => ( value += 'a' );
		const b = ( value: string ) => ( value += 'b' );
		const c = ( value: string ) => ( value += 'c' );

		expect( compose( [ a, b, c ] )( 'test' ) ).toBe( 'testcba' );
	} );

	it( 'executes functions right-to-left when passed as a mix of separate arguments and arrays', () => {
		const a = ( value: string ) => ( value += 'a' );
		const b = ( value: string ) => ( value += 'b' );
		const c = ( value: string ) => ( value += 'c' );
		const d = ( value: string ) => ( value += 'd' );
		const e = ( value: string ) => ( value += 'e' );

		expect( compose( [ a, b ], c, [ d ], e )( 'test' ) ).toBe(
			'testedcba'
		);
	} );
} );
