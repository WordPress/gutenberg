/*
 * Root babel config delegates to `tools/build-scripts/babel.config.cjs` so
 * that babel-related dependencies and resolution context live in a workspace
 * rather than at the repo root.
 */
module.exports = require( './tools/build-scripts/babel.config.cjs' );
