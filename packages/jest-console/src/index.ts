/**
 * Internal dependencies
 */
import './matchers';
import supportedMatchers from './supported-matchers';
import type { ExtendedMock } from './types';

/**
 * Sets spy on the console object's method to make it possible to fail test when method called without assertion.
 *
 * @param args
 */
const setConsoleMethodSpy = ( args: [ string, string ] ) => {
	const [ methodName, matcherName ] = args;
	const spy = jest
		.spyOn( console, methodName as 'error' | 'info' | 'log' | 'warn' )
		.mockName( `console.${ methodName }` ) as ExtendedMock;

	/**
	 * Resets the spy to its initial state.
	 */
	function resetSpy() {
		spy.mockReset();
		spy.assertionsNumber = 0;
	}

	/**
	 * Verifies that the spy has only been called if expected.
	 */
	function assertExpectedCalls() {
		if ( spy.assertionsNumber === 0 && spy.mock.calls.length > 0 ) {
			expect( console ).not[ matcherName ]();
		}
	}

	beforeAll( resetSpy );

	beforeEach( () => {
		assertExpectedCalls();
		resetSpy();
	} );

	afterEach( assertExpectedCalls );
};

Object.entries( supportedMatchers ).forEach( setConsoleMethodSpy );
