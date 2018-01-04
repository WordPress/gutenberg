/**
 * External dependencies
 */
import { matcherHint, printExpected, printReceived } from 'jest-matcher-utils';
import { isEqual, some } from 'lodash';

// Sets spies on console object to make it possible to convert them into test failures.
const spyError = jest.spyOn( console, 'error' );
const spyWarn = jest.spyOn( console, 'warn' );

const createToBeCalledWithMatcher = ( matcherName, methodName ) =>
	( received, ...expected ) => {
		const spy = received[ methodName ];
		const calls = spy.mock.calls;
		const pass = some(
			calls,
			objects => isEqual( objects, expected )
		);
		const message = pass ?
			() => matcherHint( `.not${ matcherName }`, spy.getMockName() ) +
				'\n\n' +
				'Expected mock function not to have been called with:\n' +
				printExpected( expected ) :
			() =>
				matcherHint( matcherName, spy.getMockName() ) +
				'\n\n' +
				'Expected mock function to have been called with:\n' +
				printExpected( expected ) + '\n' +
				'but have been called with:\n' +
				calls.map( printReceived );

		spy.mockReset();

		return {
			message,
			pass,
		};
	};

expect.extend( {
	toHaveErroredWith: createToBeCalledWithMatcher( '.toHaveErroredWith', 'error' ),
	toHaveWarnedWith: createToBeCalledWithMatcher( '.toHaveWarnedWith', 'warn' ),
} );

beforeEach( () => {
	spyError.mockReset();
	spyWarn.mockReset();
} );

afterEach( () => {
	expect( spyError ).not.toHaveBeenCalled();
	expect( spyWarn ).not.toHaveBeenCalled();
} );
