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
	getPhpFilePaths,
	getProjectSourcePath,
	getWebpackArgs,
	getWebpackEntryPoints,
	hasBabelConfig,
	hasCssnanoConfig,
	hasJestConfig,
	hasPostCSSConfig,
	hasPrettierConfig,
} = require( './config' );
const {
	fromConfigRoot,
	fromProjectRoot,
	fromScriptsRoot,
	hasProjectFile,
} = require( './file' );
const { getPackageProp, hasPackageProp } = require( './package' );
const {
	getBlockJsonModuleFields,
	getBlockJsonScriptFields,
} = require( './block-json' );

module.exports = {
	fromConfigRoot,
	fromProjectRoot,
	fromScriptsRoot,
	getAsBooleanFromENV,
	getArgFromCLI,
	getArgsFromCLI,
	getFileArgsFromCLI,
	getJestOverrideConfigFile,
	getNodeArgsFromCLI,
	getPackageProp,
	getPhpFilePaths,
	getProjectSourcePath,
	getWebpackArgs,
	getWebpackEntryPoints,
	getBlockJsonModuleFields,
	getBlockJsonScriptFields,
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
