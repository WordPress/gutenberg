/**
 * External dependencies
 */
const { join } = require( 'path' );

/**
 * WordPress dependencies
 */
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );

/**
 * Internal dependencies
 */
const { baseConfig, plugins } = require( './shared' );

/**
 * All packages are now built by esbuild (bin/packages/build.mjs).
 * Webpack is only used for file copying operations in other configs.
 * This config generates an empty webpack build.
 *
 * @type {Map<string, string>}
 */
const gutenbergScriptModules = new Map();

module.exports = {
	...baseConfig,
	name: 'script-modules',
	entry: Object.fromEntries( gutenbergScriptModules.entries() ),
	experiments: {
		outputModule: true,
	},
	output: {
		devtoolNamespace: 'wp',
		filename: '[name].min.js',
		library: {
			type: 'module',
		},
		path: join( __dirname, '..', '..', 'build-module' ),
		environment: { module: true },
		module: true,
		chunkFormat: 'module',
		asyncChunks: false,
	},
	resolve: {
		extensions: [ '.js', '.ts', '.tsx' ],
	},
	plugins: [
		...plugins,
		new DependencyExtractionWebpackPlugin( {
			combineAssets: true,
			combinedOutputFile: `./assets.php`,
		} ),
	],
	watchOptions: {
		ignored: [ '**/node_modules' ],
		aggregateTimeout: 500,
	},
};
