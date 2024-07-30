/**
 * External dependencies
 */
const { join } = require( 'path' );
const CopyWebpackPlugin = require( 'copy-webpack-plugin' );
/**
 * WordPress dependencies
 */
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );

/**
 * Internal dependencies
 */
const { baseConfig, plugins } = require( './shared' );

module.exports = {
	...baseConfig,
	name: 'interactivity',
	entry: {
		index: './packages/interactivity',
		debug: './packages/interactivity/src/debug',
		router: './packages/interactivity-router',
		navigation: './packages/block-library/src/navigation/view.js',
		query: './packages/block-library/src/query/view.js',
		image: './packages/block-library/src/image/view.js',
		file: './packages/block-library/src/file/view.js',
		search: './packages/block-library/src/search/view.js',
		accordionGroup: './packages/block-library/src/accordion-group/view.js',
	},
	experiments: {
		outputModule: true,
	},
	output: {
		devtoolNamespace: 'wp',
		filename: './build/interactivity/[name].min.js',
		library: {
			type: 'module',
		},
		path: join( __dirname, '..', '..' ),
		environment: { module: true },
		module: true,
		chunkFormat: 'module',
	},
	resolve: {
		extensions: [ '.js', '.ts', '.tsx' ],
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
								'@babel/preset-typescript',
								'@babel/preset-react',
							],
						},
					},
				],
			},
		],
	},
	plugins: [
		...plugins,
		// TODO: Move it to a different Webpack file.
		new CopyWebpackPlugin( {
			patterns: [
				{
					from: './node_modules/es-module-shims/dist/es-module-shims.wasm.js',
					to: './build/modules/importmap-polyfill.min.js',
				},
			],
		} ),
		new DependencyExtractionWebpackPlugin(),
	],
	watchOptions: {
		ignored: [ '**/node_modules' ],
		aggregateTimeout: 500,
	},
};
