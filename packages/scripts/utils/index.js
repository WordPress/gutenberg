/**
 * Internal dependencies
 */
const { getAsBooleanFromENV } = require( './process' );
const {
	getArgFromCLI,
	getArgsFromCLI,
	getFileArgsFromCLI,
	getNodeArgsFromCLI,
	hasArgInCLI,
	hasFileArgInCLI,
	spawnScript,
} = require( './cli' );
const {
	getJestOverrideConfigFile,
	getWebpackArgs,
	getWordPressSrcDirectory,
	getWebpackEntryPoints,
	getRenderPropPaths,
	hasBabelConfig,
	hasCssnanoConfig,
	hasJestConfig,
	hasPostCSSConfig,
	hasPrettierConfig,
} = require( './config' );
const { fromProjectRoot, fromConfigRoot, hasProjectFile } = require( './file' );
const { getPackageProp, hasPackageProp } = require( './package' );

module.exports = {
	fromProjectRoot,
	fromConfigRoot,
	getAsBooleanFromENV,
	getArgFromCLI,
	getArgsFromCLI,
	getFileArgsFromCLI,
	getJestOverrideConfigFile,
	getNodeArgsFromCLI,
	getPackageProp,
	getWebpackArgs,
	getWordPressSrcDirectory,
	getWebpackEntryPoints,
	getRenderPropPaths,
	hasArgInCLI,
	hasBabelConfig,
	hasCssnanoConfig,
	hasFileArgInCLI,
	hasJestConfig,
	hasPackageProp,
	hasPostCSSConfig,
	hasPrettierConfig,
	hasProjectFile,
	spawnScript,
};
