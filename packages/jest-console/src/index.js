/**
 * Internal dependencies
 */
import './matchers';

/**
 * Sets spy on the console object's method to make it possible to fail test when method called without assertion.
 *
 * @param {String} methodName Name of console method.
 */
const setConsoleMethodSpy = methodName => {
	const spy = jest.spyOn( console, methodName ).mockName( `console.${ methodName }` );

	beforeEach( () => {
		spy.mockReset();
		spy.assertionsNumber = 0;
	} );

	afterEach( () => {
		if ( spy.assertionsNumber === 0 ) {
			expect( spy ).not.toHaveBeenCalled();
		}
	} );
};

[ 'error', 'warn' ].forEach( setConsoleMethodSpy );
