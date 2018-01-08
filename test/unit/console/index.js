/**
 * External dependencies
 */
import { matcherHint, printExpected, printReceived } from 'jest-matcher-utils';
import { isEqual, some } from 'lodash';

// Sets spies on console object to make it possible to convert them into test failures.
const spyError = jest.spyOn( console, 'error' );
const spyWarn = jest.spyOn( console, 'warn' );

const createToBeCalledMatcher = ( matcherName, methodName ) =>
	( received ) => {
		const spy = received[ methodName ];
		const calls = spy.mock.calls;
		const pass = calls.length > 0;
		const message = pass ?
			() =>
				matcherHint( `.not${ matcherName }`, spy.getMockName() ) +
				'\n\n' +
				'Expected mock function not to be called but it was called with:\n' +
				calls.map( printReceived ) :
			() =>
				matcherHint( matcherName, spy.getMockName() ) +
				'\n\n' +
				'Expected mock function to be called.';

		spy.mockReset();

		return {
			message,
			pass,
		};
	};

const createToBeCalledWithMatcher = ( matcherName, methodName ) =>
	( received, ...expected ) => {
		const spy = received[ methodName ];
		const calls = spy.mock.calls;
		const pass = some(
			calls,
			objects => isEqual( objects, expected )
		);
		const message = pass ?
			() =>
				matcherHint( `.not${ matcherName }`, spy.getMockName() ) +
				'\n\n' +
				'Expected mock function not to be called with:\n' +
				printExpected( expected ) :
			() =>
				matcherHint( matcherName, spy.getMockName() ) +
				'\n\n' +
				'Expected mock function to be called with:\n' +
				printExpected( expected ) + '\n' +
				'but it was called with:\n' +
				calls.map( printReceived );

		spy.mockReset();

		return {
			message,
			pass,
		};
	};

expect.extend( {
	toHaveErrored: createToBeCalledMatcher( '.toHaveErrored', 'error' ),
	toHaveErroredWith: createToBeCalledWithMatcher( '.toHaveErroredWith', 'error' ),
	toHaveWarned: createToBeCalledMatcher( '.toHaveWarned', 'warn' ),
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
