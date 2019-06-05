/**
 * Internal dependencies
 */
const {
	getCliArg,
	getCliArgs,
	hasCliArg,
	hasFileInCliArgs,
	spawnScript,
} = require( './cli' );
const {
	getWebpackArgs,
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
	getWebpackArgs,
	hasBabelConfig,
	hasCliArg,
	hasFileInCliArgs,
	hasJestConfig,
	hasPackageProp,
	hasProjectFile,
	spawnScript,
};
