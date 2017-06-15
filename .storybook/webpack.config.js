const config = require( '../webpack.config' );
const webpack = require( 'webpack' );
config.module.rules = [
	// Exclude the sass loader to override it
	...config.module.rules.filter( ( rule ) => ! rule.test.test( '.scss' ) ),
	{
		test: /\.md/,
		use: 'raw-loader',
	},
	{
		test: /\.scss$/,
		use: [
			{ loader: 'style-loader' },
			{ loader: 'css-loader' },
			{ loader: 'postcss-loader' },
			{
				loader: 'sass-loader',
				query: {
					includePaths: [ 'editor/assets/stylesheets' ],
					data: '@import "variables"; @import "mixins"; @import "animations";@import "z-index";',
					outputStyle: 'production' === process.env.NODE_ENV ?
						'compressed' : 'nested',
				},
			},
		],
	},
];
config.externals = [];

// Exclude Uglify Plugin to avoid breaking the React Components Display Name
config.plugins = config.plugins.filter( plugin => {
	return plugin.constructor !== webpack.optimize.UglifyJsPlugin;
} );

module.exports = config;
