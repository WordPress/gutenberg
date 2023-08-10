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
const { resolve } = require( 'path' );
const { sync: spawn } = require( 'cross-spawn' );
const {
	installDefaultBrowsersForNpmInstall,
} = require( 'playwright-core/lib/server' );

/**
 * Internal dependencies
 */
const { fromConfigRoot, hasProjectFile } = require( '../utils' );

// TODO: await.
installDefaultBrowsersForNpmInstall();

const config =
	! hasProjectFile( 'playwright.config.ts' ) &&
	! hasProjectFile( 'playwright.config.ts' )
		? [ '--config', fromConfigRoot( 'playwright.config.ts' ) ]
		: [];

// Set the default artifacts path.
if ( ! process.env.WP_ARTIFACTS_PATH ) {
	process.env.WP_ARTIFACTS_PATH = resolve(
		process.env.GITHUB_WORKSPACE || process.cwd(),
		'artifacts'
	);
}

const testResult = spawn(
	'npx',
	[ require.resolve( '@playwright/test/cli' ), 'test', ...config ],
	{
		stdio: 'inherit',
	}
);

if ( testResult.status > 0 ) {
	process.exit( testResult.status );
}
