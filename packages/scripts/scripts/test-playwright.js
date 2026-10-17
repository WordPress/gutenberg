// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'test';
process.env.NODE_ENV = 'test';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on( 'unhandledRejection', ( err ) => {
	throw err;
} );
const { resolve } = require( 'node:path' );
const { sync: spawn } = require( 'cross-spawn' );
const {
	fromConfigRoot,
	hasProjectFile,
	hasArgInCLI,
	getArgFromCLI,
	getArgsFromCLI,
	getAsBooleanFromENV,
} = require( '../utils' );

const wpEnvConfig = getArgFromCLI( '--wp-env-config' );

if ( wpEnvConfig === null ) {
	console.error(
		'Error: The --wp-env-config option requires the path to a wp-env config file, as in --wp-env-config=<path>.'
	);
	process.exit( 1 );
}

// Playwright rejects options it does not know.
const playwrightArgs = getArgsFromCLI().filter(
	( arg ) => arg.split( '=' )[ 0 ] !== '--wp-env-config'
);

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
	// As with `wp-env start`, this merges in the override file of the config
	// (such as `.wp-env.test.override.json` for `.wp-env.test.json`) and any
	// `WP_ENV_*` environment variables. Versions of `@wordpress/env` before
	// support for `--config` ignore the custom config path.
	loadConfig( resolve( '.' ), wpEnvConfig ).then( ( envConfig ) => {
		// A config without the deprecated tests environment has only the
		// development environment to run the tests against.
		const port =
			envConfig?.env?.tests?.port ?? envConfig?.env?.development?.port;
		if ( port ) {
			process.env.WP_BASE_URL = `http://localhost:${ port }`;
		}
		spawnProcess();
	} );
} else {
	spawnProcess();
}
