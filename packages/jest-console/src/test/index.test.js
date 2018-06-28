/* eslint-disable no-console */

/**
 * External dependencies
 */
import { forEach } from 'lodash';

/**
 * Internal dependencies
 */
import '../matchers';

describe( 'jest-console', () => {
	forEach(
		{
			error: 'toHaveErrored',
			info: 'toHaveInformed',
			log: 'toHaveLogged',
			warn: 'toHaveWarned',
		},
		( matcherName, methodName ) => {
			describe( `console.${ methodName }`, () => {
				const matcherNameWith = `${ matcherName }With`;
				const message = `This is ${ methodName }!`;

				test( `${ matcherName } works`, () => {
					console[ methodName ]( message );

					expect( console )[ matcherName ]();
				} );

				test( `${ matcherName } works when not called`, () => {
					expect( console ).not[ matcherName ]();
					expect(
						() => expect( console )[ matcherName ]()
					).toThrowErrorMatchingSnapshot();
				} );

				test( `${ matcherNameWith } works with arguments that match`, () => {
					console[ methodName ]( message );

					expect( console )[ matcherNameWith ]( message );
				} );

				test( `${ matcherNameWith } works when not called`, () => {
					expect( console ).not[ matcherNameWith ]( message );
					expect(
						() => expect( console )[ matcherNameWith ]( message )
					).toThrowErrorMatchingSnapshot();
				} );

				test( `${ matcherNameWith } works with many arguments that do not match`, () => {
					console[ methodName ]( 'Unknown message.' );
					console[ methodName ]( message, 'Unknown param.' );

					expect( console ).not[ matcherNameWith ]( message );
					expect(
						() => expect( console )[ matcherNameWith ]( message )
					).toThrowErrorMatchingSnapshot();
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
			} );
		}
	);
} );
