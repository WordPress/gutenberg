/**
 * External dependencies
 */
const { sync: spawn } = require( 'cross-spawn' );
const { sync: resolveBin } = require( 'resolve-bin' );

/**
 * Internal dependencies
 */
const {
	fromConfigRoot,
	getCliArgs,
	hasCliArg,
	hasProjectFile,
} = require( '../utils' );

const hasWebpackConfig = hasCliArg( '--config' ) ||
	hasProjectFile( 'webpack.config.js' ) ||
	hasProjectFile( 'webpack.config.babel.js' );

if ( hasWebpackConfig ) {
	// Sets environment to production.
	process.env.NODE_ENV = 'production';

	const { status } = spawn(
		resolveBin( 'webpack' ),
		getCliArgs(),
		{ stdio: 'inherit' }
	);
	process.exit( status );
} else {
	// Sets environment to production.
	process.env.NODE_ENV = 'production';

	const { status } = spawn(
		resolveBin( 'webpack' ),
		[ '--config', fromConfigRoot( 'webpack.config.js' ) ],
		{ stdio: 'inherit' }
	);
	process.exit( status );
}
