import { createRequire } from 'node:module';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
const require = createRequire( import.meta.url );
const configPath = require.resolve( '../../config' );
const originalConfig = require( configPath );
const loadConfig = vi.fn();
require.cache[ configPath ].exports = { ...originalConfig, loadConfig };
const runtimePath = require.resolve( '../../runtime' );
const originalRuntime = require( runtimePath );
// Stop `start` as soon as it picks a runtime, so nothing else runs.
const stopAfterRuntime = new Error( 'Runtime selected.' );
const getRuntime = vi.fn( () => {
	throw stopAfterRuntime;
} );
require.cache[ runtimePath ].exports = { ...originalRuntime, getRuntime };
const start = require( '../start' );
afterAll( () => {
	require.cache[ configPath ].exports = originalConfig;
	require.cache[ runtimePath ].exports = originalRuntime;
	delete require.cache[ require.resolve( '../start' ) ];
} );

describe( 'start', () => {
	const spinner = { text: '' };

	beforeEach( () => {
		vi.clearAllMocks();
	} );

	it( 'should prefer the --runtime flag over the config file', async () => {
		loadConfig.mockResolvedValue( { runtime: 'playground' } );

		await expect( start( { spinner, runtime: 'docker' } ) ).rejects.toBe(
			stopAfterRuntime
		);
		expect( getRuntime ).toHaveBeenCalledWith( 'docker' );
	} );

	it( 'should use the runtime from the config file', async () => {
		loadConfig.mockResolvedValue( { runtime: 'playground' } );

		await expect( start( { spinner } ) ).rejects.toBe( stopAfterRuntime );
		expect( getRuntime ).toHaveBeenCalledWith( 'playground' );
	} );

	it( 'should default to docker', async () => {
		loadConfig.mockResolvedValue( {} );

		await expect( start( { spinner } ) ).rejects.toBe( stopAfterRuntime );
		expect( getRuntime ).toHaveBeenCalledWith( 'docker' );
	} );
} );
