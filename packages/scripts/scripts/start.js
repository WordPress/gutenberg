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
	result = spawn(
		resolveBin( 'webpack' ),
		[ '--watch', ...args ],
		{ stdio: 'inherit' }
	);
} else {
	result = spawn(
		resolveBin( 'parcel' ),
		[ 'watch', ...args ],
		{ stdio: 'inherit' }
	);
}

process.exit( result.status );
