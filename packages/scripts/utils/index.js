/**
 * Internal dependencies
 */
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
	getWebpackArgs,
	hasBabelConfig,
	getJestOverrideConfigFile,
	hasJestConfig,
	hasPrettierConfig,
	hasPostCSSConfig,
} = require( './config' );
const {
	buildWordPress,
	downloadWordPressZip,
	mergeYAMLConfigs,
} = require( './env' );
const { fromProjectRoot, fromConfigRoot, hasProjectFile } = require( './file' );
const { hasPackageProp } = require( './package' );

module.exports = {
	buildWordPress,
	fromProjectRoot,
	fromConfigRoot,
	getArgFromCLI,
	getArgsFromCLI,
	getFileArgsFromCLI,
	getNodeArgsFromCLI,
	getWebpackArgs,
	hasBabelConfig,
	hasArgInCLI,
	hasFileArgInCLI,
	getJestOverrideConfigFile,
	hasJestConfig,
	hasPackageProp,
	hasPrettierConfig,
	hasPostCSSConfig,
	hasProjectFile,
	downloadWordPressZip,
	mergeYAMLConfigs,
	spawnScript,
};
