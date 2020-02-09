/**
 * Internal dependencies
 */
const {
	getArgFromCLI,
	getArgsFromCLI,
	getFileArgsFromCLI,
	hasArgInCLI,
	hasFileArgInCLI,
	spawnScript,
} = require( './cli' );
const {
	getWebpackArgs,
	hasBabelConfig,
	hasJestConfig,
	hasPrettierConfig,
} = require( './config' );
const {
	buildWordPress,
	downloadWordPressZip,
	mergeYAMLConfigs,
} = require( './env' );
const { fromProjectRoot, fromConfigRoot, hasProjectFile } = require( './file' );
const { hasPackageProp } = require( './package' );
const { camelCaseDash } = require( './string' );

module.exports = {
	buildWordPress,
	camelCaseDash,
	fromProjectRoot,
	fromConfigRoot,
	getArgFromCLI,
	getArgsFromCLI,
	getFileArgsFromCLI,
	getWebpackArgs,
	hasBabelConfig,
	hasArgInCLI,
	hasFileArgInCLI,
	hasJestConfig,
	hasPackageProp,
	hasPrettierConfig,
	hasProjectFile,
	downloadWordPressZip,
	mergeYAMLConfigs,
	spawnScript,
};
