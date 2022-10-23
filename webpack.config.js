/**
 * Internal dependencies
 */
const blocksConfig = require( './tools/webpack/blocks' );
const developmentConfigs = require( './tools/webpack/development' );
const packagesConfig = require( './tools/webpack/packages' );

module.exports = [ blocksConfig, packagesConfig, ...developmentConfigs ];
