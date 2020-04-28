/**
 * External dependencies
 */
const path = require( 'path' );

/**
 * WordPress dependencies
 */
const postcssConfig = require( '@wordpress/postcss-config' );

module.exports = ( { config } ) => {
	config.module.rules.push(
		{
			test: /\/stories\/.+\.js$/,
			loaders: [ require.resolve( '@storybook/source-loader' ) ],
			enforce: 'pre',
		},
		{
			test: /\.scss$/,
			use: [
				'style-loader',
				'css-loader',
				{
					loader: 'postcss-loader',
					options: {
						ident: 'postcss',
						plugins: postcssConfig.plugins,
					},
				},
				'sass-loader',
			],
			include: path.resolve( __dirname ),
		}
	);

	return config;
};
