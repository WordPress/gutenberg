/**
 * Internal dependencies
 */
const blocksConfig = require( './tools/webpack/blocks' );
const developmentConfigs = require( './tools/webpack/development' );
const interactivity = require( './tools/webpack/interactivity' );
const packagesConfig = require( './tools/webpack/packages' );

module.exports = [
	...blocksConfig,
	interactivity,
	packagesConfig,
	...developmentConfigs,
];
