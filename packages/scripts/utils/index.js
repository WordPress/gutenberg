/**
 * Internal dependencies
 */
const { getNodeArgsFromCLI, spawnScript } = require( './cli' );
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
const { fromConfigRoot } = require( './file' );

module.exports = {
	buildWordPress,
	downloadWordPressZip,
	fromConfigRoot,
	getNodeArgsFromCLI,
	getWebpackArgs,
	hasBabelConfig,
	hasJestConfig,
	hasPrettierConfig,
	mergeYAMLConfigs,
	spawnScript,
};
