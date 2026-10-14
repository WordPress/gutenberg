// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'test';
process.env.NODE_ENV = 'test';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on( 'unhandledRejection', ( err ) => {
	throw err;
} );
const { dirname, resolve } = require( 'node:path' );
const { sync: spawn } = require( 'cross-spawn' );
const {
	extractWpEnvConfigArg,
	fromConfigRoot,
	hasProjectFile,
	hasArgInCLI,
	getArgsFromCLI,
	getAsBooleanFromENV,
	getTestsBaseUrl,
} = require( '../utils' );

const { wpEnvConfig, args: playwrightArgs } =
	extractWpEnvConfigArg( getArgsFromCLI() );

if ( wpEnvConfig === null ) {
	console.error(
		'Error: The --wp-env-config option requires the path to a wp-env config file.'
	);
	process.exit( 1 );
}

/**
 * @typedef {import('../../env/lib/config/load-config').WPConfig} WPConfig
 */

/**
 * Loads any configuration from a given directory.
 *
 * @type {(configDirectoryPath: string, customConfigPath?: string|null) => Promise<WPConfig> | null}
 */
let loadConfig = null;

try {
	// First, try to load the package installed from among the optional peerDependencies.
	loadConfig = require( '@wordpress/env/lib/config' ).loadConfig;
} catch {
	console.log(
		'Notice: Could not find @wordpress/env package. Using WP_BASE_URL environment variable or else the default http://localhost:8889 URL for tests.'
	);
}

if ( ! getAsBooleanFromENV( 'PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD' ) ) {
	const result = spawn(
		'node',
		[ require.resolve( '@playwright/test/cli' ), 'install' ],
		{ stdio: 'inherit' }
	);

	if ( result.status > 0 ) {
		process.exit( result.status );
	}
}

const config =
	! hasArgInCLI( '--config' ) &&
	! hasProjectFile( 'playwright.config.ts' ) &&
	! hasProjectFile( 'playwright.config.js' )
		? [ '--config', fromConfigRoot( 'playwright.config.js' ) ]
		: [];

// Set the default artifacts path.
if ( ! process.env.WP_ARTIFACTS_PATH ) {
	process.env.WP_ARTIFACTS_PATH = resolve(
		process.env.GITHUB_WORKSPACE || process.cwd(),
		'artifacts'
	);
}

function spawnProcess() {
	const testResult = spawn(
		'node',
		[
			require.resolve( '@playwright/test/cli' ),
			'test',
			...config,
			...playwrightArgs,
		],
		{
			stdio: 'inherit',
		}
	);

	if ( testResult.status > 0 ) {
		process.exit( testResult.status );
	}
}

if ( loadConfig && ! process.env.WP_BASE_URL ) {
	// Like `wp-env --config`, resolve the path relative to the current working
	// directory. It must be absolute for `loadConfig()`.
	const customConfigPath = wpEnvConfig ? resolve( wpEnvConfig ) : null;
	getTestsBaseUrl(
		loadConfig,
		customConfigPath ? dirname( customConfigPath ) : resolve( '.' ),
		customConfigPath
	).then( ( baseUrl ) => {
		if ( baseUrl ) {
			process.env.WP_BASE_URL = baseUrl;
		}
		spawnProcess();
	} );
} else {
	spawnProcess();
}
