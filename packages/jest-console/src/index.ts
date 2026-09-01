import { spyOn } from 'jest-mock';
import './matchers';
import supportedMatchers from './supported-matchers';
import type { ExtendedMock } from './types';

type MatcherName = `toHave${ 'Errored' | 'Informed' | 'Logged' | 'Warned' }`;
type ConsoleMatchers = Record< MatcherName, () => void >;

const {
	afterEach: registerAfterEach,
	beforeAll: registerBeforeAll,
	beforeEach: registerBeforeEach,
	expect: expectConsole,
} = globalThis as unknown as {
	afterEach: ( callback: () => unknown ) => void;
	beforeAll: ( callback: () => unknown ) => void;
	beforeEach: ( callback: () => unknown ) => void;
	expect: ( received: Console ) => ConsoleMatchers & {
		not: ConsoleMatchers;
	};
};

/**
 * Sets spy on the console object's method to make it possible to fail test when method called without assertion.
 *
 * @param args
 */
const setConsoleMethodSpy = ( args: [ string, string ] ) => {
	const [ methodName, matcherName ] = args;
	const spy = spyOn(
		console,
		methodName as 'error' | 'info' | 'log' | 'warn'
	).mockName( `console.${ methodName }` ) as ExtendedMock;

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
			// Using 'as' to satisfy TypeScript compiler about the matcher name.
			const name = matcherName as MatcherName;

			expectConsole( console ).not[ name ]();
		}
	}

	registerBeforeAll( resetSpy );

	registerBeforeEach( () => {
		assertExpectedCalls();
		resetSpy();
	} );

	registerAfterEach( assertExpectedCalls );
};

Object.entries( supportedMatchers ).forEach( setConsoleMethodSpy );
