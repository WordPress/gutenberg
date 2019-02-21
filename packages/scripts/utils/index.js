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
const {
	camelCaseDash,
} = require( './string' );

module.exports = {
	camelCaseDash,
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
