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

module.exports = {
	...baseConfig,
	name: 'script-modules',
	entry: {
		'interactivity/index': './packages/interactivity',
		'interactivity/debug': './packages/interactivity/debug',

		'interactivity-router': './packages/interactivity-router',

		'block-library/file/view': './packages/block-library/file/view',
		'block-library/image/view': './packages/block-library/image/view',
		'block-library/navigation/view':
			'./packages/block-library/navigation/view',
		'block-library/query/view': './packages/block-library/query/view',
		'block-library/search/view': './packages/block-library/search/view',
	},
	experiments: {
		outputModule: true,
	},
	output: {
		devtoolNamespace: 'wp',
		filename: './build-module/[name].min.js',
		library: {
			type: 'module',
		},
		path: join( __dirname, '..', '..' ),
		environment: { module: true },
		module: true,
		chunkFormat: 'module',
		asyncChunks: false,
	},
	resolve: {
		extensions: [ '.js', '.ts', '.tsx' ],
		exportsFields: [ 'wp-script-module-exports', 'exports' ],
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
	plugins: [ ...plugins, new DependencyExtractionWebpackPlugin() ],
	watchOptions: {
		ignored: [ '**/node_modules' ],
		aggregateTimeout: 500,
	},
};
