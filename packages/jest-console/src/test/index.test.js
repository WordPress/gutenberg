/* eslint-disable no-console */

/**
 * Internal dependencies
 */
import '../matchers';

describe( 'jest-console', () => {
	describe.each( [
		[ 'error', 'toHaveErrored' ],
		[ 'info', 'toHaveInformed' ],
		[ 'log', 'toHaveLogged' ],
		[ 'warn', 'toHaveWarned' ],
	] )( 'console.%s', ( methodName, matcherName ) => {
		const matcherNameWith = `${ matcherName }With`;
		const message = `This is ${ methodName }!`;

		test( `${ matcherName } works`, () => {
			console[ methodName ]( message );

			expect( console )[ matcherName ]();
		} );

		test( `${ matcherName } works when not called`, () => {
			expect( console ).not[ matcherName ]();
			expect( () => expect( console )[ matcherName ]() ).toThrow(
				'Expected mock function to be called.'
			);
		} );

		test( `${ matcherNameWith } works with arguments that match`, () => {
			console[ methodName ]( message );

			expect( console )[ matcherNameWith ]( message );
		} );

		test( `${ matcherNameWith } works when not called`, () => {
			expect( console ).not[ matcherNameWith ]( message );
			expect( () =>
				expect( console )[ matcherNameWith ]( message )
			).toThrow(
				/Expected mock function to be called with:.*but it was called with:/s
			);
		} );

		test( `${ matcherNameWith } works with many arguments that do not match`, () => {
			console[ methodName ]( 'Unknown message.' );
			console[ methodName ]( message, 'Unknown param.' );

			expect( console ).not[ matcherNameWith ]( message );
			expect( () =>
				expect( console )[ matcherNameWith ]( message )
			).toThrow(
				/Expected mock function to be called with:.*but it was called with:.*Unknown param./s
			);
		} );

		test( 'assertions number gets incremented after every matcher call', () => {
			const spy = console[ methodName ];

			expect( spy.assertionsNumber ).toBe( 0 );

			console[ methodName ]( message );

			expect( console )[ matcherName ]();
			expect( spy.assertionsNumber ).toBe( 1 );

			expect( console )[ matcherNameWith ]( message );
			expect( spy.assertionsNumber ).toBe( 2 );
		} );

		describe( 'lifecycle', () => {
			beforeAll( () => {
				// This is a difficult one to test, since the matcher's
				// own lifecycle is defined to run before ours. Infer
				// that we're being watched by testing the console
				// method as being a spy.
				expect(
					console[ methodName ].assertionsNumber
				).toBeGreaterThanOrEqual( 0 );
			} );

			it( 'captures logging in lifecycle', () => {} );
		} );
	} );
} );

/* eslint-enable no-console */
