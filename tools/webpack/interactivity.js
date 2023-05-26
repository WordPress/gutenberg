/**
 * External dependencies
 */
const { join } = require( 'path' );

/**
 * Internal dependencies
 */
const { baseConfig } = require( './shared' );

module.exports = {
	...baseConfig,
	watchOptions: {
		aggregateTimeout: 200,
	},
	name: 'interactivity',
	entry: {
		index: {
			import: `./packages/interactivity`,
			library: {
				name: [ 'wp', 'interactivity' ],
				type: 'window',
			},
		},
	},
	output: {
		devtoolNamespace: 'wp',
		filename: './build/interactivity/[name].min.js',
		path: join( __dirname, '..', '..' ),
	},
	resolve: {
		alias: {
			react: 'preact/compat',
			'react-dom': 'preact/compat',
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
};
