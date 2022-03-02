/**
 * External dependencies
 */
const { sync: spawn } = require( 'cross-spawn' );
const { sync: resolveBin } = require( 'resolve-bin' );

/**
 * Internal dependencies
 */
const { getWebpackArgs, hasArgInCLI } = require( '../utils' );

process.env.NODE_ENV = process.env.NODE_ENV || 'production';

if ( hasArgInCLI( '--webpack-no-externals' ) ) {
	process.env.WP_NO_EXTERNALS = true;
}

if ( hasArgInCLI( '--webpack-bundle-analyzer' ) ) {
	process.env.WP_BUNDLE_ANALYZER = true;
}

if ( hasArgInCLI( '--webpack-copy-php' ) ) {
	process.env.WP_COPY_PHP_FILES_TO_DIST = true;
}

const { status } = spawn( resolveBin( 'webpack' ), getWebpackArgs(), {
	stdio: 'inherit',
} );
process.exit( status );
