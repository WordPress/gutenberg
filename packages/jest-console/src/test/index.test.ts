/* eslint-disable no-console */
import {
	afterAll,
	afterEach as vitestAfterEach,
	beforeAll as vitestBeforeAll,
	beforeEach as vitestBeforeEach,
	describe,
	expect as vitestExpect,
	it,
	test,
	vi,
} from 'vitest';
import { spyOn as jestSpyOn } from 'jest-mock';
import type { ExtendedMock } from '../types';

vi.restoreAllMocks();
vi.stubGlobal( 'afterEach', vitestAfterEach );
vi.stubGlobal( 'beforeAll', vitestBeforeAll );
vi.stubGlobal( 'beforeEach', vitestBeforeEach );
vi.stubGlobal( 'expect', vitestExpect );
vi.stubGlobal( 'jest', { spyOn: jestSpyOn } );

await import( '../index' );

afterAll( () => vi.unstubAllGlobals() );

// The matchers replace the console methods with counting spies.
function getSpy( methodName: 'error' | 'info' | 'log' | 'warn' ) {
	return console[ methodName ] as unknown as ExtendedMock;
}

describe( 'jest-console', () => {
	describe.each( [
		[ 'error', 'toHaveErrored' ],
		[ 'info', 'toHaveInformed' ],
		[ 'log', 'toHaveLogged' ],
		[ 'warn', 'toHaveWarned' ],
	] as const )( 'console.%s', ( methodName, matcherName ) => {
		const matcherNameWith = `${ matcherName }With` as const;
		const message = `This is ${ methodName }!`;

		test( `${ matcherName } works`, () => {
			console[ methodName ]( message );

			vitestExpect( console )[ matcherName ]();
		} );

		test( `${ matcherName } works when not called`, () => {
			vitestExpect( console ).not[ matcherName ]();
			vitestExpect( () =>
				vitestExpect( console )[ matcherName ]()
			).toThrow( 'Expected mock function to be called.' );
		} );

		test( `${ matcherNameWith } works with arguments that match`, () => {
			console[ methodName ]( message );

			vitestExpect( console )[ matcherNameWith ]( message );
		} );

		test( `${ matcherNameWith } works when not called`, () => {
			vitestExpect( console ).not[ matcherNameWith ]( message );
			vitestExpect( () =>
				vitestExpect( console )[ matcherNameWith ]( message )
			).toThrow(
				/Expected mock function to be called with:.*but it was called with:/s
			);
		} );

		test( `${ matcherNameWith } works with many arguments that do not match`, () => {
			console[ methodName ]( 'Unknown message.' );
			console[ methodName ]( message, 'Unknown param.' );

			vitestExpect( console ).not[ matcherNameWith ]( message );
			vitestExpect( () =>
				vitestExpect( console )[ matcherNameWith ]( message )
			).toThrow(
				/Expected mock function to be called with:.*but it was called with:.*Unknown param./s
			);
		} );

		test( 'assertions number gets incremented after every matcher call', () => {
			const spy = getSpy( methodName );

			vitestExpect( spy.assertionsNumber ).toBe( 0 );

			console[ methodName ]( message );

			vitestExpect( console )[ matcherName ]();
			vitestExpect( spy.assertionsNumber ).toBe( 1 );

			vitestExpect( console )[ matcherNameWith ]( message );
			vitestExpect( spy.assertionsNumber ).toBe( 2 );
		} );

		describe( 'lifecycle', () => {
			vitestBeforeAll( () => {
				// Disable reason:
				// This is a difficult one to test, since the matcher's
				// own lifecycle is defined to run before ours. Infer
				// that we're being watched by testing the console
				// method as being a spy.
				vitestExpect(
					getSpy( methodName ).assertionsNumber
				).toBeGreaterThanOrEqual( 0 );
			} );

			// Disable reason:
			// See beforeAll implementation and explanation added there.
			it( 'captures logging in lifecycle', () => {} );
		} );
	} );
} );

/* eslint-enable no-console */
