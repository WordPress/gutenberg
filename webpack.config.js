/**
 * Internal dependencies
 */
const blocksConfig = require( './tools/webpack/blocks' );
const packagesConfig = require( './tools/webpack/packages' );
const esmPackagesConfig = require( './tools/webpack/esm-packages' );

module.exports = [/* blocksConfig, packagesConfig, */ esmPackagesConfig ];
