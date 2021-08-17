/**
 * External dependencies
 */
const TerserPlugin = require( 'terser-webpack-plugin' );

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
				parallel: true,
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
		view: './view.js',
	},
	output: {
		filename: '[name].min.js',
	},
	plugins: [ new ReadableJsAssetsWebpackPlugin() ],
};
