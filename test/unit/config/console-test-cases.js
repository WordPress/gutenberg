/* eslint-disable no-console */

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

export default function consoleTests() {
	describe.each( [
		[ 'error', 'toHaveErrored' ],
		[ 'info', 'toHaveInformed' ],
		[ 'log', 'toHaveLogged' ],
		[ 'warn', 'toHaveWarned' ],
	] )( 'console.%s', ( methodName, matcherName ) => {
		const matcherNameWith = `${ matcherName }With`;
		const message = `This is ${ methodName }!`;

		test.fails(
			'rejects an extra unexpected call after a matching assertion',
			() => {
				console[ methodName ]( message );
				console[ methodName ]( 'Unexpected message.' );
				expect( console )[ matcherNameWith ]( message );
			}
		);

		test( `${ matcherName } accepts an observed call`, () => {
			console[ methodName ]( message );
			expect( console )[ matcherName ]();
		} );

		test( `${ matcherName } rejects a missing call`, () => {
			expect( console ).not[ matcherName ]();
			expect( () => expect( console )[ matcherName ]() ).toThrow(
				'Expected mock function to be called.'
			);
		} );

		test( `${ matcherNameWith } accepts matching arguments`, () => {
			console[ methodName ]( message );
			expect( console )[ matcherNameWith ]( message );
		} );

		test( `${ matcherNameWith } supports asymmetric matchers`, () => {
			console[ methodName ]( message, { status: 400 } );
			expect( console )[ matcherNameWith ](
				expect.stringContaining( methodName ),
				expect.objectContaining( { status: 400 } )
			);
		} );

		test( `${ matcherNameWith } rejects a missing call`, () => {
			expect( console ).not[ matcherNameWith ]( message );
			expect( () =>
				expect( console )[ matcherNameWith ]( message )
			).toThrow(
				/Expected mock function to be called with:.*but it was called with:/s
			);
		} );

		test( `${ matcherNameWith } rejects non-matching arguments`, () => {
			console[ methodName ]( 'Unknown message.' );
			console[ methodName ]( message, 'Unknown param.' );

			expect( console ).not[ matcherNameWith ]( message );
			expect( () =>
				expect( console )[ matcherNameWith ]( message )
			).toThrow(
				/Expected mock function to be called with:.*but it was called with:.*Unknown param./s
			);
			expect( console )[ matcherNameWith ]( 'Unknown message.' );
			expect( console )[ matcherNameWith ]( message, 'Unknown param.' );
		} );

		test( 'accounts for all duplicate matching calls and permits repeated assertions', () => {
			console[ methodName ]( message );
			console[ methodName ]( message );
			expect( console )[ matcherNameWith ]( message );
			expect( console )[ matcherNameWith ]( message );
			expect( console[ methodName ] ).toHaveBeenCalledTimes( 2 );
		} );

		test.fails( 'does not account for a later duplicate call', () => {
			console[ methodName ]( message );
			expect( console )[ matcherNameWith ]( message );
			console[ methodName ]( message );
		} );

		test( 'broad assertions account for all calls already made', () => {
			console[ methodName ]( message );
			console[ methodName ]( 'Another message.' );
			expect( console )[ matcherName ]();
		} );

		test.fails( 'broad assertions do not account for later calls', () => {
			console[ methodName ]( message );
			expect( console )[ matcherName ]();
			console[ methodName ]( 'Later message.' );
		} );

		test.fails(
			'negative assertions do not account for other calls',
			() => {
				console[ methodName ]( message );
				expect( console ).not[ matcherNameWith ]( 'Another message.' );
			}
		);

		test.fails(
			'caught negative assertion failures do not account for calls',
			() => {
				console[ methodName ]( message );
				expect( () =>
					expect( console ).not[ matcherNameWith ]( message )
				).toThrow();
			}
		);

		test.fails(
			'caught positive assertion failures do not account for calls',
			() => {
				console[ methodName ]( message );
				expect( () =>
					expect( console )[ matcherNameWith ]( 'Another message.' )
				).toThrow();
			}
		);

		describe.each( [
			[ 'mockClear', ( spy ) => spy.mockClear() ],
			[ 'mockReset', ( spy ) => spy.mockReset() ],
			[ 'mockRestore', ( spy ) => spy.mockRestore() ],
			[ 'clearAllMocks', () => vi.clearAllMocks() ],
			[ 'resetAllMocks', () => vi.resetAllMocks() ],
		] )( '%s', ( name, reset ) => {
			test.fails(
				'preserves unaccounted calls when clearing mock history',
				() => {
					console[ methodName ]( message );
					reset( console[ methodName ] );
					expect( console ).not[ matcherName ]();
				}
			);

			test( 'allows clearing calls that were already expected', () => {
				console[ methodName ]( message );
				expect( console )[ matcherNameWith ]( message );
				reset( console[ methodName ] );
				expect( console ).not[ matcherName ]();
				console[ methodName ]( message );
				expect( console )[ matcherNameWith ]( message );
			} );

			test.fails(
				'does not reuse accounting for calls made after a reset',
				() => {
					console[ methodName ]( message );
					expect( console )[ matcherNameWith ]( message );
					reset( console[ methodName ] );
					console[ methodName ]( message );
				}
			);
		} );

		describe( 'cleanup hooks', () => {
			let cleanup;

			beforeEach( () => {
				cleanup = () => {};
			} );
			afterEach( () => cleanup() );

			test( 'accepts calls asserted in afterEach', () => {
				console[ methodName ]( message );
				cleanup = () => expect( console )[ matcherNameWith ]( message );
			} );

			test.fails( 'rejects extra calls made in afterEach', () => {
				console[ methodName ]( message );
				expect( console )[ matcherNameWith ]( message );
				cleanup = () => console[ methodName ]( 'Cleanup message.' );
			} );

			// The unasserted console call must fail the test even after resetting mocks.
			// eslint-disable-next-line vitest/expect-expect
			test.fails(
				'does not let afterEach reset hide an unexpected call',
				() => {
					console[ methodName ]( message );
					cleanup = () => vi.resetAllMocks();
				}
			);
		} );

		test( 'starts the next test with fresh mock history and accounting', () => {
			expect( console[ methodName ] ).not.toHaveBeenCalled();
			console[ methodName ]( message );
			expect( console )[ matcherNameWith ]( message );
		} );
	} );

	describe( 'when a test restores all mocks', () => {
		test( 'keeps the shared console spies active', () => {
			vi.restoreAllMocks();
			expect( vi.isMockFunction( console.error ) ).toBe( true );
		} );

		test( 'reinstalls the shared console spies before the next test', () => {
			for ( const methodName of Object.keys( {
				error: true,
				info: true,
				log: true,
				warn: true,
			} ) ) {
				expect( vi.isMockFunction( console[ methodName ] ) ).toBe(
					true
				);
			}
		} );
	} );
}

/* eslint-enable no-console */
