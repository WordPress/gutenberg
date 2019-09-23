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
} = require( './config' );
const {
	buildWordPress,
	downloadWordPressZip,
	getManagedWordPressPath,
	installManagedWordPress,
	mergeYAMLConfigs,
} = require( './env' );
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
	buildWordPress,
	camelCaseDash,
	fromConfigRoot,
	getArgFromCLI,
	getArgsFromCLI,
	getFileArgsFromCLI,
	getManagedWordPressPath,
	getWebpackArgs,
	hasBabelConfig,
	hasArgInCLI,
	hasFileArgInCLI,
	hasJestConfig,
	hasPackageProp,
	hasProjectFile,
	installManagedWordPress,
	downloadWordPressZip,
	mergeYAMLConfigs,
	spawnScript,
};
