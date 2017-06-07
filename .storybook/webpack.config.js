const config = require( '../webpack.config' );
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

module.exports = config;
