/**
 * External dependencies
 */
const { join } = require( 'path' );
const CopyWebpackPlugin = require( 'copy-webpack-plugin' );

/**
 * Internal dependencies
 */
const { baseConfig, plugins } = require( './shared' );

module.exports = {
	...baseConfig,
	name: 'interactivity',
	entry: {
		index: `./packages/interactivity/src/index.js`,
		navigation: './packages/block-library/src/navigation/view.js',
		query: './packages/block-library/src/query/view.js',
		image: './packages/block-library/src/image/view.js',
		file: './packages/block-library/src/file/view.js',
		search: './packages/block-library/src/search/view.js',
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
	},
	externalsType: 'module',
	externals: {
		'@wordpress/interactivity': '@wordpress/interactivity',
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
		// TODO: Move it to a different Webpack file.
		new CopyWebpackPlugin( {
			patterns: [
				{
					from: './node_modules/es-module-shims/dist/es-module-shims.wasm.js',
					to: './build/modules/importmap-polyfill.min.js',
				},
			],
		} ),
	],
	watchOptions: {
		ignored: [ '**/node_modules' ],
		aggregateTimeout: 500,
	},
};
