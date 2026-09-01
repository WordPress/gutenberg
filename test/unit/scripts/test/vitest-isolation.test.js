import { describe, expect, it, vi } from 'vitest';

const mock = vi.fn( () => 'original mock implementation' );
const target = {
	method: () => 'original method implementation',
};

describe.sequential( 'Vitest test isolation', () => {
	it( 'can change mocks, spies, globals, environment variables, and timers', () => {
		mock.mockImplementation( () => 'changed mock implementation' );
		mock();
		vi.spyOn( target, 'method' ).mockReturnValue(
			'changed method implementation'
		);
		vi.stubGlobal( '__gutenbergVitestTestGlobal', 'stubbed' );
		vi.stubEnv( 'GUTENBERG_VITEST_TEST_ENV', 'stubbed' );
		vi.useFakeTimers();

		expect( mock() ).toBe( 'changed mock implementation' );
		expect( target.method() ).toBe( 'changed method implementation' );
	} );

	it( 'starts the next test with clean runner-managed state', () => {
		expect( mock ).not.toHaveBeenCalled();
		expect( mock() ).toBe( 'original mock implementation' );
		expect( target.method() ).toBe( 'original method implementation' );
		expect( globalThis.__gutenbergVitestTestGlobal ).toBeUndefined();
		expect( process.env.GUTENBERG_VITEST_TEST_ENV ).toBeUndefined();
		expect( vi.isFakeTimers() ).toBe( false );
	} );
} );
