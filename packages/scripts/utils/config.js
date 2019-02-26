/**
 * Internal dependencies
 */
const { hasCliArg } = require( './cli' );
const { hasProjectFile } = require( './file' );
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

module.exports = {
	hasBabelConfig,
	hasJestConfig,
};
