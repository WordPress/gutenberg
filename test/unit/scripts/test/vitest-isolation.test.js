import { describe, expect, it, vi } from 'vitest';

const mock = vi.fn();
const target = {
	method: () => 'original',
};

describe.sequential( 'Vitest test isolation', () => {
	it( 'can mutate shared test state', () => {
		mock();
		vi.spyOn( target, 'method' ).mockReturnValue( 'mocked' );
		vi.stubGlobal( '__gutenbergVitestTestGlobal', 'stubbed' );
		vi.stubEnv( 'GUTENBERG_VITEST_TEST_ENV', 'stubbed' );
		vi.useFakeTimers();

		expect( target.method() ).toBe( 'mocked' );
	} );

	it( 'starts the next test with clean state', () => {
		expect( mock ).not.toHaveBeenCalled();
		expect( target.method() ).toBe( 'original' );
		expect( globalThis.__gutenbergVitestTestGlobal ).toBeUndefined();
		expect( process.env.GUTENBERG_VITEST_TEST_ENV ).toBeUndefined();
		expect( vi.isFakeTimers() ).toBe( false );
	} );
} );
