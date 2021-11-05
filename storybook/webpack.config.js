/**
 * External dependencies
 */
const path = require( 'path' );

/**
 * WordPress dependencies
 */
const postcssPlugins = require( '@wordpress/postcss-plugins-preset' );

const scssLoaders = ( { isLazy } ) => [
	{
		loader: 'style-loader',
		options: { injectType: isLazy ? 'lazyStyleTag' : 'styleTag' },
	},
	'css-loader',
	{
		loader: 'postcss-loader',
		options: {
			postcssOptions: {
				ident: 'postcss',
				plugins: postcssPlugins,
			},
		},
	},
	'sass-loader',
];

module.exports = ( { config } ) => {
	config.module.rules.push(
		{
			test: /\/stories\/.+\.js$/,
			loader: require.resolve( '@storybook/source-loader' ),
			enforce: 'pre',
		},
		{
			test: /\.scss$/,
			exclude: /\.lazy\.scss$/,
			use: scssLoaders( { isLazy: false } ),
			include: path.resolve( __dirname ),
		},
		{
			test: /\.lazy\.scss$/,
			use: scssLoaders( { isLazy: true } ),
			include: path.resolve( __dirname ),
		}
	);

	return config;
};
