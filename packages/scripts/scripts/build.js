/**
 * External dependencies
 */
const { sync: spawn } = require( 'cross-spawn' );
const { sync: resolveBin } = require( 'resolve-bin' );

/**
 * Internal dependencies
 */
const {
	getCliArgs,
	hasCliArg,
	hasProjectFile,
} = require( '../utils' );

const args = getCliArgs();

const hasWebpackConfig = hasCliArg( '--config' ) ||
	hasProjectFile( 'webpack.config.js' ) ||
	hasProjectFile( 'webpackfile.js' );

let result;
if ( hasWebpackConfig ) {
	// Sets environment to production.
	process.env.NODE_ENV = 'production';

	result = spawn(
		resolveBin( 'webpack' ),
		[ ...args ],
		{ stdio: 'inherit' }
	);
} else {
	result = spawn(
		resolveBin( 'parcel' ),
		[ 'build', ...args ],
		{ stdio: 'inherit' }
	);
}

process.exit( result.status );
