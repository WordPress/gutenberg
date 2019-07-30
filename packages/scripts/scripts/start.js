/**
 * External dependencies
 */
const { sync: spawn } = require( 'cross-spawn' );
const { sync: resolveBin } = require( 'resolve-bin' );

/**
 * Internal dependencies
 */
const { getWebpackArgs } = require( '../utils' );

const { status } = spawn(
	resolveBin( 'webpack' ),
	getWebpackArgs( [ '--watch' ] ),
	{ stdio: 'inherit' }
);
process.exit( status );
