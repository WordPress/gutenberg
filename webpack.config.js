/**
 * Internal dependencies
 */
const developmentConfigs = require( './tools/webpack/development' );
const packagesConfig = require( './tools/webpack/packages' );
const vendorsConfig = require( './tools/webpack/vendors' );

module.exports = [ packagesConfig, ...developmentConfigs, ...vendorsConfig ];
