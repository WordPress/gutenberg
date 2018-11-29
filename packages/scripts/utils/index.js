/**
 * Internal dependencies
 */
const {
	getCliArg,
	getCliArgs,
	hasCliArg,
	spawnScript,
} = require( './cli' );
const {
	fromConfigRoot,
	hasProjectFile,
} = require( './file' );
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
	fromConfigRoot,
	getCliArg,
	getCliArgs,
	hasBabelConfig,
	hasCliArg,
	hasJestConfig,
	hasPackageProp,
	hasProjectFile,
	spawnScript,
};
