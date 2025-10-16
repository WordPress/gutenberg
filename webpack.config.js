/**
 * Internal dependencies
 */
const developmentConfigs = require( './tools/webpack/development' );
const scriptModules = require( './tools/webpack/script-modules' );
const packagesConfig = require( './tools/webpack/packages' );
const vendorsConfig = require( './tools/webpack/vendors' );

module.exports = [
	scriptModules,
	packagesConfig,
	...developmentConfigs,
	...vendorsConfig,
];
