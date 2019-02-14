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

const hasWebpackConfig = hasCliArg( '--config' ) ||
	hasProjectFile( 'webpack.config.js' ) ||
	hasProjectFile( 'webpack.config.babel.js' );

if ( hasWebpackConfig ) {
	const { status } = spawn(
		resolveBin( 'webpack' ),
		[ '--watch', ...getCliArgs() ],
		{ stdio: 'inherit' }
	);
	process.exit( status );
} else {
	// eslint-disable-next-line no-console
	console.log( 'Webpack config file is missing.' );
	process.exit( 1 );
}
