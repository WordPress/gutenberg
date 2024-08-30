/**
 * Internal dependencies
 */
const blocksConfig = require( './tools/webpack/blocks' );
const developmentConfigs = require( './tools/webpack/development' );
const interactivity = require( './tools/webpack/interactivity' );
const packagesConfig = require( './tools/webpack/packages' );
const vendorsConfig = require( './tools/webpack/vendors' );

module.exports = [
	...blocksConfig,
	interactivity,
	packagesConfig,
	...developmentConfigs,
	...vendorsConfig,
];
