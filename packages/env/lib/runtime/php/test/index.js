import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
const require = createRequire( import.meta.url );
const crossSpawn = require( 'cross-spawn' );
const PhpRuntime = require( '..' );

describe( 'PhpRuntime', () => {
	let workDirectoryPath;
	let server;

	afterEach( () => {
		server?.kill();
		vi.restoreAllMocks();
		rmSync( workDirectoryPath, { recursive: true, force: true } );
	} );

	// On Windows the runtime checks for a PHP process, not the site folder.
	it.skipIf( process.platform === 'win32' )(
		'reports the port the server started on, not the configured one',
		async () => {
			workDirectoryPath = mkdtempSync( path.join( tmpdir(), 'wp-env-' ) );
			const siteDir = path.join( workDirectoryPath, 'php' );
			mkdirSync( siteDir );
			// Stands in for PHP's server: a process serving the site folder.
			server = spawn( process.execPath, [
				'-e',
				'setInterval( () => {}, 1000 )',
				siteDir,
			] );
			// `--auto-port` started it on 8918, as 8917 was busy.
			writeFileSync(
				path.join( workDirectoryPath, 'php-server.pid' ),
				`${ server.pid } 8918`
			);

			const status = await new PhpRuntime().getStatus( {
				workDirectoryPath,
				env: {
					development: {
						port: 8917,
						config: { WP_SITEURL: 'http://localhost:8917' },
					},
				},
			} );

			expect( status.ports.development ).toBe( 8918 );
			expect( status.urls.development ).toBe( 'http://localhost:8918' );
		}
	);

	it( 'activates each plugin source in its own process, in config order', async () => {
		workDirectoryPath = mkdtempSync( path.join( tmpdir(), 'wp-env-' ) );
		const databaseDir = path.join( workDirectoryPath, 'php-database' );
		mkdirSync( databaseDir );
		writeFileSync( path.join( databaseDir, 'clean.sqlite' ), '' );
		const sync = vi
			.spyOn( crossSpawn, 'sync' )
			.mockReturnValue( { status: 0, stdout: '', stderr: '' } );

		// Pinterest's name sorts before WooCommerce, which it requires.
		await new PhpRuntime().clean(
			{
				name: 'wp-env',
				workDirectoryPath,
				env: {
					development: {
						pluginSources: [
							{ basename: 'woocommerce.latest-stable' },
							{ basename: 'pinterest-for-woocommerce' },
						],
					},
				},
			},
			{ spinner: {} }
		);

		const siteDir = path.join( workDirectoryPath, 'php' );
		expect(
			sync.mock.calls.map( ( [ , [ script, ...args ] ] ) => [
				path.basename( script ),
				...args,
			] )
		).toEqual( [
			[ 'install.php', siteDir, 'wp-env' ],
			[ 'activate.php', siteDir, 'woocommerce.latest-stable' ],
			[ 'activate.php', siteDir, 'pinterest-for-woocommerce' ],
		] );
	} );
} );
