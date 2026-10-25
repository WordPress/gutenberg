import { describe, expect, it, vi } from 'vitest';

/**
 * Loads the entry point against a fresh set of mocks.
 *
 * The module runs its work on import, so each case needs its own registry.
 *
 * @param result What `run` should do.
 * @return The mocked core module, to assert against.
 */
async function loadEntryPoint( result: () => Promise< void > ) {
	vi.resetModules();
	vi.doMock( '@actions/core', () => ( { setFailed: vi.fn() } ) );
	vi.doMock( '../run.ts', () => ( { run: result } ) );

	const core = await import( '@actions/core' );
	await import( '../index.ts' );
	await new Promise( process.nextTick );

	return core;
}

describe( 'entry point', () => {
	/*
	 * A green step with no report is indistinguishable from a clean run, and
	 * the writer downstream would clear the existing report.
	 */
	it( 'fails the step when the report cannot be produced', async () => {
		const core = await loadEntryPoint( () =>
			Promise.reject( new Error( 'EACCES' ) )
		);

		expect( core.setFailed ).toHaveBeenCalledWith( 'EACCES' );
	} );

	it( 'leaves the step green on a clean run', async () => {
		const core = await loadEntryPoint( () => Promise.resolve() );

		expect( core.setFailed ).not.toHaveBeenCalled();
	} );
} );
