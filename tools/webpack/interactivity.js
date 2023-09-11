/**
 * External dependencies
 */
const { join } = require( 'path' );

/**
 * Internal dependencies
 */
const { baseConfig, plugins } = require( './shared' );

module.exports = {
	...baseConfig,
	watchOptions: {
		ignored: [ '**/node_modules' ],
		aggregateTimeout: 500,
	},
	name: 'interactivity',
	entry: {
		navigation:
			'./packages/block-library/src/navigation/view-interactivity.js',
		image: './packages/block-library/src/image/view-interactivity.js',
	},
	output: {
		filename: './block-library/blocks/[name]/view-interactivity.min.js',
		path: join( __dirname, '..', '..', 'build' ),
		chunkLoadingGlobal: '__WordPressPrivateInteractivityAPI__',
	},
	optimization: {
		...baseConfig.optimization,
		runtimeChunk: {
			name: 'private-interactivity',
		},
		splitChunks: {
			cacheGroups: {
				interactivity: {
					name: 'private-interactivity',
					test: /[\\/]packages[\\/]interactivity[\\/]|[\\/]node_modules[\\/]/,
					filename: './interactivity/index.min.js',
					chunks: 'all',
					minSize: 0,
					priority: -10,
				},
			},
		},
	},
	module: {
		rules: [
			{
				test: /\.(j|t)sx?$/,
				exclude: /node_modules/,
				use: [
					{
						loader: require.resolve( 'babel-loader' ),
						options: {
							cacheDirectory:
								process.env.BABEL_CACHE_DIRECTORY || true,
							babelrc: false,
							configFile: false,
							presets: [
								[
									'@babel/preset-react',
									{
										runtime: 'automatic',
										importSource: 'preact',
									},
								],
							],
						},
					},
				],
			},
		],
	},
	plugins: [
		...plugins,
		// new DependencyExtractionWebpackPlugin( {
		// 	injectPolyfill: false,
		// } ),
	].filter( Boolean ),
};
