/**
 * External dependencies
 */
const { sync: spawn } = require( 'cross-spawn' );
const { sync: resolveBin } = require( 'resolve-bin' );

/**
 * Internal dependencies
 */
const { getArgFromCLI, getWebpackArgs, hasArgInCLI } = require( '../utils' );
const EXIT_ERROR_CODE = 1;

if ( hasArgInCLI( '--webpack-no-externals' ) ) {
	process.env.WP_NO_EXTERNALS = true;
}

if ( hasArgInCLI( '--webpack-bundle-analyzer' ) ) {
	process.env.WP_BUNDLE_ANALYZER = true;
}

if ( hasArgInCLI( '--webpack--devtool' ) ) {
	process.env.WP_DEVTOOL = getArgFromCLI( '--webpack--devtool' );
}

if ( hasArgInCLI( '--webpack-copy-php' ) ) {
	process.env.WP_COPY_PHP_FILES_TO_DIST = true;
}

process.env.WP_SRC_DIRECTORY = hasArgInCLI( '--webpack-src-dir' )
	? getArgFromCLI( '--webpack-src-dir' )
	: 'src';

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
