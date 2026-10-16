const { getAsBooleanFromENV } = require( './process' );
const {
	extractOptionFromArgs,
	getArgFromCLI,
	getArgsFromCLI,
	getFileArgsFromCLI,
	getNodeArgsFromCLI,
	hasArgInCLI,
	hasFileArgInCLI,
	spawnScript,
} = require( './cli' );
const {
	getPhpFilePaths,
	getProjectSourcePath,
	getWebpackArgs,
	getWebpackEntryPoints,
	hasBabelConfig,
	hasCssnanoConfig,
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
const { getTestsBaseUrl } = require( './wp-env' );

module.exports = {
	extractOptionFromArgs,
	fromConfigRoot,
	fromProjectRoot,
	fromScriptsRoot,
	getAsBooleanFromENV,
	getArgFromCLI,
	getArgsFromCLI,
	getFileArgsFromCLI,
	getNodeArgsFromCLI,
	getPackageProp,
	getPhpFilePaths,
	getProjectSourcePath,
	getWebpackArgs,
	getWebpackEntryPoints,
	getBlockJsonModuleFields,
	getBlockJsonScriptFields,
	getTestsBaseUrl,
	hasArgInCLI,
	hasBabelConfig,
	hasCssnanoConfig,
	hasFileArgInCLI,
	hasPackageProp,
	hasPostCSSConfig,
	hasPrettierConfig,
	hasProjectFile,
	spawnScript,
};
