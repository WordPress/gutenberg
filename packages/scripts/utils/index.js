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
	getVitestOverrideConfigFile,
	getPhpFilePaths,
	getProjectSourcePath,
	getWebpackArgs,
	getWebpackEntryPoints,
	hasBabelConfig,
	hasCssnanoConfig,
	hasVitestConfig,
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
	getVitestOverrideConfigFile,
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
	hasVitestConfig,
	hasPackageProp,
	hasPostCSSConfig,
	hasPrettierConfig,
	hasProjectFile,
	spawnScript,
};
