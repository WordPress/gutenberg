/**
 * Internal dependencies
 */
const { hasArgInCLI, getArgsFromCLI } = require( './cli' );
const { fromConfigRoot, hasProjectFile } = require( './file' );
const { hasPackageProp } = require( './package' );

const hasBabelConfig = () =>
	hasProjectFile( '.babelrc' ) ||
	hasProjectFile( '.babelrc.js' ) ||
	hasProjectFile( 'babel.config.js' ) ||
	hasPackageProp( 'babel' );

const hasJestConfig = () =>
	hasArgInCLI( '-c' ) ||
	hasArgInCLI( '--config' ) ||
	hasProjectFile( 'jest.config.js' ) ||
	hasProjectFile( 'jest.config.json' ) ||
	hasPackageProp( 'jest' );

const hasWebpackConfig = () => hasArgInCLI( '--config' ) ||
	hasProjectFile( 'webpack.config.js' ) ||
	hasProjectFile( 'webpack.config.babel.js' );

const getWebpackArgs = ( additionalArgs = [] ) => {
	const webpackArgs = getArgsFromCLI();
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
