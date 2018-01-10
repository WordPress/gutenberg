/**
 * External dependencies
 */
import { upperFirst } from 'lodash';

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
		if ( spy.assertionsNumber === 0 && spy.mock.calls.length > 0 ) {
			const matcherName = `toHave${ upperFirst( methodName ) }ed`;
			expect( console ).not[ matcherName ]();
		}
	} );
};

[ 'error', 'warn' ].forEach( setConsoleMethodSpy );
