const path = require( 'path' );
const postCssConfigPlugins = require( '../bin/packages/post-css-config' );

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
				/**
				 * Configuring PostCSS with Webpack
				 * https://github.com/postcss/postcss-loader#plugins
				 */
				{
					loader: 'postcss-loader',
					options: {
						ident: 'postcss',
						plugins: () => postCssConfigPlugins,
					},
				},
				'sass-loader',
			],
			include: path.resolve( __dirname ),
		}
	);

	return config;
};
