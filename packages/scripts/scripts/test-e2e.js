// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'test';
process.env.NODE_ENV = 'test';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on( 'unhandledRejection', ( err ) => {
	throw err;
} );

/**
 * External dependencies
 */
const path = require( 'path' );
const jest = require( 'jest' );
const { sync: spawn } = require( 'cross-spawn' );

/**
 * Internal dependencies
 */
const {
	getJestOverrideConfigFile,
	fromConfigRoot,
	getArgFromCLI,
	getArgsFromCLI,
	hasArgInCLI,
	hasProjectFile,
} = require( '../utils' );

const result = spawn( 'node', [ require.resolve( 'puppeteer-core/install' ) ], {
	stdio: 'inherit',
} );

if ( result.status > 0 ) {
	process.exit( result.status );
}

// Provides a default config path for Puppeteer when jest-puppeteer.config.js
// wasn't found at the root of the project or a custom path wasn't defined
// using JEST_PUPPETEER_CONFIG environment variable.
if (
	! hasProjectFile( 'jest-puppeteer.config.js' ) &&
	! process.env.JEST_PUPPETEER_CONFIG
) {
	process.env.JEST_PUPPETEER_CONFIG = fromConfigRoot( 'puppeteer.config.js' );
}

const configFile = getJestOverrideConfigFile( 'e2e' );

const config = configFile
	? [ '--config', JSON.stringify( require( configFile ) ) ]
	: [];

// Force e2e tests to run serially, not in parallel. They test against a shared Docker instance
const hasRunInBand = hasArgInCLI( '--runInBand' ) || hasArgInCLI( '-i' );
const runInBand = ! hasRunInBand ? [ '--runInBand' ] : [];

if ( hasArgInCLI( '--puppeteer-interactive' ) ) {
	process.env.PUPPETEER_HEADLESS = 'false';
	process.env.PUPPETEER_SLOWMO = getArgFromCLI( '--puppeteer-slowmo' ) || 80;
}

if ( hasArgInCLI( '--puppeteer-devtools' ) ) {
	process.env.PUPPETEER_HEADLESS = 'false';
	process.env.PUPPETEER_DEVTOOLS = 'true';
}

const configsMapping = {
	WP_BASE_URL: '--wordpress-base-url',
	WP_USERNAME: '--wordpress-username',
	WP_PASSWORD: '--wordpress-password',
};

Object.entries( configsMapping ).forEach( ( [ envKey, argName ] ) => {
	if ( hasArgInCLI( argName ) ) {
		process.env[ envKey ] = getArgFromCLI( argName );
	}
} );

// Set the default artifacts path.
if ( ! process.env.WP_ARTIFACTS_PATH ) {
	process.env.WP_ARTIFACTS_PATH = path.resolve(
		process.env.GITHUB_WORKSPACE || process.cwd(),
		'artifacts'
	);
}

const cleanUpPrefixes = [ '--puppeteer-', '--wordpress-' ];

jest.run( [ ...config, ...runInBand, ...getArgsFromCLI( cleanUpPrefixes ) ] );
