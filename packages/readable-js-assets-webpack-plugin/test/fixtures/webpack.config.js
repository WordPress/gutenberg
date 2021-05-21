/**
 * External dependencies
 */
const TerserPlugin = require( 'terser-webpack-plugin' );
const path = require( 'path' );

/**
 * Internal dependencies
 */
const ReadableJsAssetsWebpackPlugin = require( '../..' );

module.exports = {
	mode: 'production',
	optimization: {
		// Only concatenate modules in production, when not analyzing bundles.
		chunkIds: 'named',
		moduleIds: 'named',
		concatenateModules: true,
		minimizer: [
			new TerserPlugin( {
				cache: true,
				parallel: true,
				sourceMap: true,
				terserOptions: {
					output: {
						comments: /translators:/i,
					},
					compress: {
						passes: 2,
					},
					mangle: {
						reserved: [ '__', '_n', '_nx', '_x' ],
					},
				},
				extractComments: false,
			} ),
		],
	},
	entry: {
		index: './index.js',
		frontend: './frontend.js',
	},
	output: {
		filename: '[name].min.js',
	},
	plugins: [ new ReadableJsAssetsWebpackPlugin() ],
};
