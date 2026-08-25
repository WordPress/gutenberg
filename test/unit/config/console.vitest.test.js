/* eslint-disable no-console */

import { describe, expect, test } from 'vitest';

describe( 'Vitest console matchers', () => {
	describe.each( [
		[ 'error', 'toHaveErrored' ],
		[ 'info', 'toHaveInformed' ],
		[ 'log', 'toHaveLogged' ],
		[ 'warn', 'toHaveWarned' ],
	] )( 'console.%s', ( methodName, matcherName ) => {
		const matcherNameWith = `${ matcherName }With`;
		const message = `This is ${ methodName }!`;

		test( `${ matcherName } accepts an observed call`, () => {
			console[ methodName ]( message );
			expect( console )[ matcherName ]();
		} );

		test( `${ matcherName } rejects a missing call`, () => {
			expect( console ).not[ matcherName ]();
			expect( () => expect( console )[ matcherName ]() ).toThrow(
				'Expected mock function to be called.'
			);
		} );

		test( `${ matcherNameWith } accepts matching arguments`, () => {
			console[ methodName ]( message );
			expect( console )[ matcherNameWith ]( message );
		} );

		test( `${ matcherNameWith } supports asymmetric matchers`, () => {
			console[ methodName ]( message, { status: 400 } );
			expect( console )[ matcherNameWith ](
				expect.stringContaining( methodName ),
				expect.objectContaining( { status: 400 } )
			);
		} );

		test( `${ matcherNameWith } rejects a missing call`, () => {
			expect( console ).not[ matcherNameWith ]( message );
			expect( () =>
				expect( console )[ matcherNameWith ]( message )
			).toThrow(
				/Expected mock function to be called with:.*but it was called with:/s
			);
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

		test( 'counts matcher assertions', () => {
			const spy = console[ methodName ];

			expect( spy.assertionsNumber ).toBe( 0 );
			console[ methodName ]( message );
			expect( console )[ matcherName ]();
			expect( console )[ matcherNameWith ]( message );
			expect( spy.assertionsNumber ).toBe( 2 );
		} );

		test( 'registers the console spy before test execution', () => {
			expect(
				console[ methodName ].assertionsNumber
			).toBeGreaterThanOrEqual( 0 );
		} );
	} );
} );

/* eslint-enable no-console */
