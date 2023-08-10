/**
 * External dependencies
 */
const { join } = require( 'path' );
const { ModuleFederationPlugin } = require( 'webpack' ).container;

/**
 * Internal dependencies
 */
const { baseConfig } = require( './shared' );

module.exports = {
	mode: baseConfig.mode,
	entry: { empty: './empty.js' },
	name: 'interactivity',
	devtool: false,
	output: {
		devtoolNamespace: 'wp',
		filename: './[name].min.js',
		path: join( __dirname, '..', '..', 'build', 'interactivity' ),
	},
	plugins: [
		new ModuleFederationPlugin( {
			name: '__wordpress_module_federation_interactivity__',
			filename: 'index.min.js',
			exposes: {
				'./interactivity': './packages/interactivity/src/index.js',
			},
		} ),
	],
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
	watchOptions: {
		ignored: [ '**/node_modules' ],
		aggregateTimeout: 500,
	},
};
