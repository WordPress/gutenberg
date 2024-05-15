/*
 * THIS FILE IS USED ONLY FOR BUILDING THE INTERACTIVITY PACKAGE FOR CDN.
 */

/**
 * External dependencies
 */
const { join } = require( 'path' );

/**
 * Internal dependencies
 */
const { baseConfig } = require( '../../tools/webpack/shared' );

module.exports = {
	...baseConfig,
	name: 'interactivity-cdn',
	entry: {
		index: './src/index',
		debug: './src/debug',
	},
	experiments: {
		outputModule: true,
	},
	output: {
		devtoolNamespace: 'wp',
		filename: './packages/interactivity/build-cdn/[name]-standalone.min.js',
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
	watchOptions: {
		ignored: [ '**/node_modules' ],
		aggregateTimeout: 500,
	},
};
