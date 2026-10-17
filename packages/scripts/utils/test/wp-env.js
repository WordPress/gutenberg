import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { rimrafSync } from 'rimraf';
import {
	afterAll,
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from 'vitest';
const require = createRequire( import.meta.url );
const { extractWpEnvConfigArg, getTestsBaseUrl } = require( '../wp-env' );

describe( 'extractWpEnvConfigArg', () => {
	it( 'returns all arguments when the option is not passed', () => {
		expect(
			extractWpEnvConfigArg( [ '--config', 'playwright.config.ts' ] )
		).toEqual( {
			wpEnvConfig: undefined,
			args: [ '--config', 'playwright.config.ts' ],
		} );
	} );

	it( 'extracts the option with its value after an equals sign', () => {
		expect(
			extractWpEnvConfigArg( [
				'--config=playwright.config.ts',
				'--wp-env-config=../../.wp-env.test.json',
				'--ui',
			] )
		).toEqual( {
			wpEnvConfig: '../../.wp-env.test.json',
			args: [ '--config=playwright.config.ts', '--ui' ],
		} );
	} );

	it( 'extracts the option with its value as the next argument', () => {
		expect(
			extractWpEnvConfigArg( [
				'--config',
				'playwright.config.ts',
				'--wp-env-config',
				'../../.wp-env.test.json',
				'specs/editor.spec.js',
			] )
		).toEqual( {
			wpEnvConfig: '../../.wp-env.test.json',
			args: [
				'--config',
				'playwright.config.ts',
				'specs/editor.spec.js',
			],
		} );
	} );

	it.each( [
		[ 'without a value', [ '--ui', '--wp-env-config' ] ],
		[ 'with an empty value', [ '--wp-env-config=', '--ui' ] ],
	] )( 'returns null for the option %s', ( _, args ) => {
		expect( extractWpEnvConfigArg( args ) ).toEqual( {
			wpEnvConfig: null,
			args: [ '--ui' ],
		} );
	} );
} );

/*
 * These tests use stand-ins for loadConfig() to check what it is called with,
 * and how the result is read, including results from versions of
 * @wordpress/env before `--config` support, which always have a `tests`
 * environment. The tests further below use the real loadConfig().
 */
describe( 'getTestsBaseUrl with a stand-in loadConfig', () => {
	const configDirectory = path.join( os.tmpdir(), 'project' );
	const customConfigPath = path.join( configDirectory, '.wp-env.test.json' );

	it( 'loads the custom config and uses its port when there is one', async () => {
		const loadConfig = vi.fn().mockResolvedValue( {
			env: { development: { port: 8991 } },
		} );

		await expect(
			getTestsBaseUrl( loadConfig, configDirectory, customConfigPath )
		).resolves.toBe( 'http://localhost:8991' );

		expect( loadConfig ).toHaveBeenCalledWith(
			configDirectory,
			customConfigPath
		);
	} );

	it( 'loads the default config and uses the development port when there is no tests environment', async () => {
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

	it( 'uses the tests environment when loadConfig ignores the custom config', async () => {
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
			getTestsBaseUrl( loadConfig, configDirectory, customConfigPath )
		).resolves.toBe( 'http://localhost:8889' );
	} );

	it( 'returns null when no port is configured', async () => {
		const loadConfig = vi.fn().mockResolvedValue( { env: {} } );

		await expect(
			getTestsBaseUrl( loadConfig, configDirectory )
		).resolves.toBeNull();
	} );
} );

/*
 * The real loadConfig() from @wordpress/env merges each config file with its
 * override and the WP_ENV_* environment variables. Parsing the default config
 * looks up the latest WordPress version over the network, so that lookup is
 * replaced before the config modules are loaded, as in the tests of
 * @wordpress/env itself.
 */
describe( 'getTestsBaseUrl with the loadConfig from @wordpress/env', () => {
	const envConfigPath = require.resolve( '@wordpress/env/lib/config' );
	const envLibPath = path.dirname( path.dirname( envConfigPath ) );
	const configModulePaths = [
		envConfigPath,
		path.join( envLibPath, 'config', 'load-config.js' ),
		path.join( envLibPath, 'config', 'parse-config.js' ),
	];
	const wordpressModule = require( path.join( envLibPath, 'wordpress.js' ) );
	const originalGetLatestWordPressVersion =
		wordpressModule.getLatestWordPressVersion;
	wordpressModule.getLatestWordPressVersion = async () => '100.0.0';
	for ( const modulePath of configModulePaths ) {
		delete require.cache[ modulePath ];
	}
	const { loadConfig } = require( envConfigPath );

	let root;
	let testsConfigPath;
	let originalEnv;

	const writeConfig = ( fileName, config ) =>
		fs.writeFileSync(
			path.join( root, fileName ),
			JSON.stringify( config )
		);

	beforeEach( () => {
		root = fs.mkdtempSync(
			path.join( os.tmpdir(), 'wp-scripts-wp-env-config-' )
		);
		testsConfigPath = path.join( root, '.wp-env.test.json' );

		originalEnv = { ...process.env };
		process.env.WP_ENV_HOME = path.join( root, 'wp-env-home' );
		delete process.env.WP_ENV_PORT;
		delete process.env.WP_ENV_TESTS_PORT;
	} );

	afterEach( () => {
		rimrafSync( root );
		process.env = originalEnv;
	} );

	afterAll( () => {
		wordpressModule.getLatestWordPressVersion =
			originalGetLatestWordPressVersion;
		for ( const modulePath of configModulePaths ) {
			delete require.cache[ modulePath ];
		}
	} );

	/*
	 * Projects that test against a `.wp-env.test.json` disable the deprecated
	 * tests environment in both configs, as Gutenberg does. Without that,
	 * `wp-env` still adds a tests environment on the default port 8889.
	 */
	const writeSplitConfigs = () => {
		writeConfig( '.wp-env.json', { testsEnvironment: false, port: 8888 } );
		writeConfig( '.wp-env.test.json', {
			testsEnvironment: false,
			port: 8889,
		} );
	};

	it( 'uses the port from the override of the custom config', async () => {
		writeSplitConfigs();
		writeConfig( '.wp-env.override.json', { port: 8891 } );
		writeConfig( '.wp-env.test.override.json', { port: 8991 } );

		await expect(
			getTestsBaseUrl( loadConfig, root, testsConfigPath )
		).resolves.toBe( 'http://localhost:8991' );
	} );

	it( 'uses the port of the custom config when it has no override', async () => {
		writeSplitConfigs();
		writeConfig( '.wp-env.override.json', { port: 8891 } );

		await expect(
			getTestsBaseUrl( loadConfig, root, testsConfigPath )
		).resolves.toBe( 'http://localhost:8889' );
	} );

	it( 'uses the port from the WP_ENV_PORT environment variable over the override', async () => {
		writeSplitConfigs();
		writeConfig( '.wp-env.test.override.json', { port: 8991 } );
		process.env.WP_ENV_PORT = '9999';

		await expect(
			getTestsBaseUrl( loadConfig, root, testsConfigPath )
		).resolves.toBe( 'http://localhost:9999' );
	} );

	it( 'uses the development port from the override of the default config when there is no tests environment', async () => {
		writeSplitConfigs();
		writeConfig( '.wp-env.override.json', { port: 8890 } );
		writeConfig( '.wp-env.test.override.json', { port: 8991 } );

		await expect( getTestsBaseUrl( loadConfig, root ) ).resolves.toBe(
			'http://localhost:8890'
		);
	} );

	it( 'uses the default tests port when the tests environment is not disabled', async () => {
		writeConfig( '.wp-env.json', { port: 8888 } );
		writeConfig( '.wp-env.override.json', { port: 8890 } );

		await expect( getTestsBaseUrl( loadConfig, root ) ).resolves.toBe(
			'http://localhost:8889'
		);
	} );

	it( 'uses the tests port from the override when the deprecated tests environment is enabled', async () => {
		writeConfig( '.wp-env.json', {
			port: 8888,
			testsEnvironment: true,
		} );
		writeConfig( '.wp-env.override.json', { testsPort: 8991 } );

		await expect( getTestsBaseUrl( loadConfig, root ) ).resolves.toBe(
			'http://localhost:8991'
		);
	} );

	it( 'rejects when the custom config does not exist', async () => {
		writeConfig( '.wp-env.json', { testsEnvironment: false, port: 8888 } );

		await expect(
			getTestsBaseUrl( loadConfig, root, testsConfigPath )
		).rejects.toThrow( 'Config file not found' );
	} );
} );
