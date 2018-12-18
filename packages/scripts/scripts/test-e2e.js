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
const jest = require( 'jest' );

/**
 * Internal dependencies
 */
const {
	fromConfigRoot,
	getCliArgs,
	hasCliArg,
	hasProjectFile,
	hasJestConfig,
} = require( '../utils' );

// Provides a default config path for Puppeteer when jest-puppeteer.config.js
// wasn't found at the root of the project or a custom path wasn't defined
// using JEST_PUPPETEER_CONFIG environment variable.
if ( ! hasProjectFile( 'jest-puppeteer.config.js' ) && ! process.env.JEST_PUPPETEER_CONFIG ) {
	process.env.JEST_PUPPETEER_CONFIG = fromConfigRoot( 'puppeteer.config.js' );
}

const config = ! hasJestConfig() ?
	[ '--config', JSON.stringify( require( fromConfigRoot( 'jest-e2e.config.js' ) ) ) ] :
	[];

const hasRunInBand = hasCliArg( '--runInBand' ) ||
	hasCliArg( '-i' );
const runInBand = ! hasRunInBand ?
	[ '--runInBand' ] :
	[];

jest.run( [ ...config, ...runInBand, ...getCliArgs() ] );
