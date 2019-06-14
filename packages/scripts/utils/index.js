/**
 * Internal dependencies
 */
const {
	getArgFromCLI,
	getArgsFromCLI,
	hasArgInCLI,
	hasFileArgInCLI,
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
	getArgFromCLI,
	getArgsFromCLI,
	getWebpackArgs,
	hasBabelConfig,
	hasArgInCLI,
	hasFileArgInCLI,
	hasJestConfig,
	hasPackageProp,
	hasProjectFile,
	spawnScript,
};
