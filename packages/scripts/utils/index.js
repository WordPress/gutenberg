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
	hasBabelConfig,
	hasJestConfig,
} = require( './config' );
const {
	fromConfigRoot,
	hasProjectFile,
} = require( './file' );
const {
	hasPackageProp,
} = require( './package' );

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
