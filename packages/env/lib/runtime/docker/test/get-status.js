import { mkdtempSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const require = createRequire( import.meta.url );
const DockerRuntime = require( '..' );

describe( 'DockerRuntime getStatus', () => {
	let workDirectoryPath;

	beforeEach( () => {
		workDirectoryPath = mkdtempSync( path.join( tmpdir(), 'wp-env-' ) );
	} );

	afterEach( () => {
		rmSync( workDirectoryPath, { recursive: true, force: true } );
	} );

	/**
	 * Gets the status with the given configured site URL, as though Docker
	 * mapped the WordPress container to the given port.
	 *
	 * @param {string}      siteUrl  The configured `WP_SITEURL`.
	 * @param {string|null} livePort The port Docker reports, or null when stopped.
	 * @return {Promise<Object>} The status.
	 */
	function getStatus( siteUrl, livePort ) {
		const runtime = new DockerRuntime();
		vi.spyOn( runtime, '_getPublicDockerPort' ).mockImplementation(
			async ( service ) => {
				if ( livePort === null ) {
					throw new Error( 'Containers are not running.' );
				}
				return service === 'mysql' ? '3306' : livePort;
			}
		);
		return runtime.getStatus(
			{
				workDirectoryPath,
				dockerComposeConfigPath: path.join(
					workDirectoryPath,
					'docker-compose.yml'
				),
				testsEnvironment: false,
				env: { development: { config: { WP_SITEURL: siteUrl } } },
			},
			{ spinner: {}, debug: false }
		);
	}

	it( 'reports the port WordPress started on, not the configured one', async () => {
		// `--auto-port` started it on 8889, as 8888 was busy.
		const status = await getStatus( 'http://localhost:8888', '8889' );

		expect( status.ports.development ).toBe( '8889' );
		expect( status.urls.development ).toBe( 'http://localhost:8889' );
	} );

	it( 'adds the port to a site URL configured on port 80', async () => {
		const status = await getStatus( 'http://localhost', '81' );

		expect( status.urls.development ).toBe( 'http://localhost:81' );
	} );

	it( 'reports no URL when the environment is stopped', async () => {
		const status = await getStatus( 'http://localhost:8888', null );

		expect( status.status ).toBe( 'stopped' );
		expect( status.urls.development ).toBeNull();
	} );
} );
