/**
 * Internal dependencies
 */
const blocksConfig = require( './tools/webpack/blocks' );
const developmentConfigs = require( './tools/webpack/development' );
const packagesConfig = require( './tools/webpack/packages' );
const experimentalConfig = require( './tools/webpack/experimental.config' );

module.exports = process.env.EXPERIMENTAL_BUILD
	? experimentalConfig
	: [ blocksConfig, packagesConfig, ...developmentConfigs ];
