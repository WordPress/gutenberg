import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { rimrafSync } from 'rimraf';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const require = createRequire( import.meta.url );
const { findConfigDirectory, getTestsBaseUrl } = require( '../wp-env' );

describe( 'findConfigDirectory', () => {
	let root;
	let workspace;

	const writeFile = ( directory, fileName ) =>
		fs.writeFileSync( path.join( directory, fileName ), '{}' );

	beforeEach( () => {
		root = fs.mkdtempSync(
			path.join( os.tmpdir(), 'wp-scripts-wp-env-root-' )
		);
		workspace = path.join( root, 'test', 'e2e' );
		fs.mkdirSync( workspace, { recursive: true } );
	} );

	afterEach( () => {
		rimrafSync( root );
	} );

	it( 'returns the starting directory when it has a config', () => {
		writeFile( workspace, '.wp-env.json' );
		writeFile( root, '.wp-env.json' );

		expect( findConfigDirectory( workspace, root ) ).toBe( workspace );
	} );

	it.each( [ '.wp-env.json', '.wp-env.test.json' ] )(
		'finds a %s at the project root from a workspace directory',
		( fileName ) => {
			writeFile( root, fileName );

			expect( findConfigDirectory( workspace, root ) ).toBe( root );
		}
	);

	it( 'returns the nearest directory with a config', () => {
		const intermediate = path.dirname( workspace );
		writeFile( intermediate, '.wp-env.json' );
		writeFile( root, '.wp-env.json' );

		expect( findConfigDirectory( workspace, root ) ).toBe( intermediate );
	} );

	it( 'does not search above the project root', () => {
		const projectRoot = path.dirname( workspace );
		writeFile( root, '.wp-env.json' );

		expect( findConfigDirectory( workspace, projectRoot ) ).toBe(
			workspace
		);
	} );

	it( 'returns the starting directory when no config is found', () => {
		expect( findConfigDirectory( workspace, root ) ).toBe( workspace );
	} );

	it( 'only uses the starting directory without a project root', () => {
		writeFile( root, '.wp-env.json' );

		expect( findConfigDirectory( workspace, undefined ) ).toBe( workspace );
	} );

	it( 'only uses the starting directory when the project root does not contain it', () => {
		const otherRoot = fs.mkdtempSync(
			path.join( os.tmpdir(), 'wp-scripts-wp-env-other-' )
		);
		writeFile( root, '.wp-env.json' );

		try {
			expect( findConfigDirectory( workspace, otherRoot ) ).toBe(
				workspace
			);
		} finally {
			rimrafSync( otherRoot );
		}
	} );
} );

/*
 * The real loadConfig() from @wordpress/env looks up the latest WordPress
 * version over the network unless the config sets `core`, so these tests use
 * stand-ins that return the shapes it produces:
 *
 * - Without the deprecated `testsEnvironment`, `env` has only `development`,
 *   whose port comes from the loaded config file and its override (for
 *   example `.wp-env.test.json` and `.wp-env.test.override.json`).
 * - With `testsEnvironment`, and in versions of @wordpress/env before
 *   `--config` support, `env` also has `tests`.
 */
describe( 'getTestsBaseUrl', () => {
	let configDirectory;

	beforeEach( () => {
		configDirectory = fs.mkdtempSync(
			path.join( os.tmpdir(), 'wp-scripts-wp-env-' )
		);
	} );

	afterEach( () => {
		rimrafSync( configDirectory );
	} );

	const writeTestsConfig = () =>
		fs.writeFileSync(
			path.join( configDirectory, '.wp-env.test.json' ),
			'{}'
		);

	it( 'loads the tests config and uses its port when there is one', async () => {
		writeTestsConfig();
		const loadConfig = vi.fn().mockResolvedValue( {
			env: { development: { port: 8991 } },
		} );

		await expect(
			getTestsBaseUrl( loadConfig, configDirectory )
		).resolves.toBe( 'http://localhost:8991' );

		// The path must be absolute, since @wordpress/env resolves it
		// relative to the current working directory.
		expect( loadConfig ).toHaveBeenCalledWith(
			configDirectory,
			path.join( configDirectory, '.wp-env.test.json' )
		);
	} );

	it( 'loads the default config and uses the development port when there is no tests config', async () => {
		const loadConfig = vi.fn().mockResolvedValue( {
			env: { development: { port: 8890 } },
		} );

		await expect(
			getTestsBaseUrl( loadConfig, configDirectory )
		).resolves.toBe( 'http://localhost:8890' );

		expect( loadConfig ).toHaveBeenCalledWith( configDirectory, null );
	} );

	it( 'uses the port of the tests environment when the config has one', async () => {
		const loadConfig = vi.fn().mockResolvedValue( {
			env: {
				development: { port: 8891 },
				tests: { port: 8991 },
			},
		} );

		await expect(
			getTestsBaseUrl( loadConfig, configDirectory )
		).resolves.toBe( 'http://localhost:8991' );
	} );

	it( 'uses the tests environment when loadConfig ignores the tests config', async () => {
		writeTestsConfig();

		// Versions of @wordpress/env before `--config` support accept only
		// the directory, and return the default config.
		const loadConfig = async ( configDirectoryPath ) => ( {
			configDirectoryPath,
			env: {
				development: { port: 8888 },
				tests: { port: 8889 },
			},
		} );

		await expect(
			getTestsBaseUrl( loadConfig, configDirectory )
		).resolves.toBe( 'http://localhost:8889' );
	} );

	it( 'returns null when no port is configured', async () => {
		const loadConfig = vi.fn().mockResolvedValue( { env: {} } );

		await expect(
			getTestsBaseUrl( loadConfig, configDirectory )
		).resolves.toBeNull();
	} );
} );
