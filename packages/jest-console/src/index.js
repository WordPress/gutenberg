/**
 * Internal dependencies
 */
import './matchers';
import supportedMatchers from './supported-matchers';

/**
 * Sets spy on the console object's method to make it possible to fail test when method called without assertion.
 *
 * @param {Array}  args
 * @param {string} args."0" Name of console method.
 * @param {string} args."1" Name of Jest matcher.
 */
const setConsoleMethodSpy = ( [ methodName, matcherName ] ) => {
	const spy = jest
		.spyOn( console, methodName )
		.mockName( `console.${ methodName }` );

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
