/* eslint-disable no-console */
import { describe, expect, it, test } from 'vitest';

describe( 'Vitest console matchers', () => {
	describe.each( [
		[ 'error', 'toHaveErrored' ],
		[ 'info', 'toHaveInformed' ],
		[ 'log', 'toHaveLogged' ],
		[ 'warn', 'toHaveWarned' ],
	] )( 'console.%s', ( methodName, matcherName ) => {
		const matcherNameWith = `${ matcherName }With`;
		const message = `This is ${ methodName }!`;

		test( `${ matcherName } accepts an expected console call`, () => {
			console[ methodName ]( message );
			expect( console )[ matcherName ]();
		} );

		test( `${ matcherName } rejects a missing console call`, () => {
			expect( console ).not[ matcherName ]();
			expect( () => expect( console )[ matcherName ]() ).toThrow(
				'Expected mock function to be called.'
			);
		} );

		test( `${ matcherNameWith } accepts matching arguments`, () => {
			console[ methodName ]( message );
			expect( console )[ matcherNameWith ]( message );
		} );

		test( `${ matcherNameWith } rejects non-matching arguments`, () => {
			console[ methodName ]( 'Unknown message.' );
			console[ methodName ]( message, 'Unknown param.' );

			expect( console ).not[ matcherNameWith ]( message );
			expect( () =>
				expect( console )[ matcherNameWith ]( message )
			).toThrow(
				/Expected mock function to be called with:.*but it was called with:.*Unknown param./s
			);
		} );

		test( 'tracks matcher assertions for lifecycle validation', () => {
			const spy = console[ methodName ];

			expect( spy.assertionsNumber ).toBe( 0 );
			console[ methodName ]( message );
			expect( console )[ matcherName ]();
			expect( spy.assertionsNumber ).toBe( 1 );
			expect( console )[ matcherNameWith ]( message );
			expect( spy.assertionsNumber ).toBe( 2 );
		} );
	} );

	it( 'does not treat collapsed console groups as log calls', () => {
		console.groupCollapsed( 'Details' );
		console.groupEnd();

		expect( console ).not.toHaveLogged();
	} );
} );

/* eslint-enable no-console */
