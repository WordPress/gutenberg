/**
 * List of packages that use the v2 build pipeline.
 * These packages are built with bin/packages/build-v2.mjs instead of
 * the traditional Babel/webpack pipeline.
 *
 * @type {string[]}
 */
const V2_PACKAGES = [ 'hooks' ];

module.exports = { V2_PACKAGES };
