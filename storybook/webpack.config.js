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
			// Currently does not work with our tsx stories
			// See https://github.com/storybookjs/storybook/issues/17275
			test: /\/stories\/.+\.(j|t)sx?$/,
			loader: require.resolve( '@storybook/source-loader' ),
			enforce: 'pre',
		},
		{
			// Allows a story description to be written as a doc comment above the exported story
			test: /\/stories\/.+\.(j|t)sx?$/,
			loader: path.resolve(
				__dirname,
				'./webpack/description-loader.js'
			),
			enforce: 'post',
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
