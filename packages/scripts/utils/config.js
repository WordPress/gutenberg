/**
 * Internal dependencies
 */
const { hasCliArg, getCliArgs } = require( './cli' );
const { fromConfigRoot, hasProjectFile } = require( './file' );
const { hasPackageProp } = require( './package' );

const hasBabelConfig = () =>
	hasProjectFile( '.babelrc' ) ||
	hasProjectFile( 'babel.config.js' ) ||
	hasPackageProp( 'babel' );

const hasJestConfig = () =>
	hasCliArg( '-c' ) ||
	hasCliArg( '--config' ) ||
	hasProjectFile( 'jest.config.js' ) ||
	hasProjectFile( 'jest.config.json' ) ||
	hasPackageProp( 'jest' );

const hasWebpackConfig = () => hasCliArg( '--config' ) ||
	hasProjectFile( 'webpack.config.js' ) ||
	hasProjectFile( 'webpack.config.babel.js' );

const getWebpackArgs = ( additionalArgs = [] ) => {
	const webpackArgs = getCliArgs();
	if ( ! hasWebpackConfig() ) {
		webpackArgs.push( '--config', fromConfigRoot( 'webpack.config.js' ) );
	}
	webpackArgs.push( ...additionalArgs );
	return webpackArgs;
};

module.exports = {
	getWebpackArgs,
	hasBabelConfig,
	hasJestConfig,
};
