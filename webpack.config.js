/**
 * Internal dependencies
 */
const blocksConfig = require( './tools/webpack/blocks' );
const developmentConfigs = require( './tools/webpack/development' );
const scriptModules = require( './tools/webpack/script-modules' );
const packagesConfig = require( './tools/webpack/packages' );
const vendorsConfig = require( './tools/webpack/vendors' );

module.exports = [
	...blocksConfig,
	packagesConfig,
	scriptModules, // Script modules build depends on the package build.
	...developmentConfigs,
	...vendorsConfig,
];
