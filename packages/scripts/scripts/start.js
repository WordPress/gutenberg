/**
 * External dependencies
 */
const { sync: spawn } = require( 'cross-spawn' );
const { sync: resolveBin } = require( 'resolve-bin' );

/**
 * Internal dependencies
 */
const { getWebpackArgs, hasArgInCLI } = require( '../utils' );
const EXIT_ERROR_CODE = 1;

const webpackArgs = getWebpackArgs();
if ( hasArgInCLI( '--hot' ) ) {
	webpackArgs.unshift( 'serve' );
} else if ( ! hasArgInCLI( '--no-watch' ) ) {
	webpackArgs.unshift( 'watch' );
}

const { status } = spawn( resolveBin( 'webpack' ), webpackArgs, {
	stdio: 'inherit',
} );
process.exit( status === null ? EXIT_ERROR_CODE : status );
