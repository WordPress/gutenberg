const path = require( 'path' );

module.exports = ( { config } ) => {
	config.module.rules.push(
		{
			test: /\/stories\/.+\.js$/,
			loaders: [ require.resolve( '@storybook/source-loader' ) ],
			enforce: 'pre',
		},
		{
			test: /\.scss$/,
			use: [ 'style-loader', 'css-loader', 'sass-loader' ],
			include: path.resolve( __dirname ),
		}
	);

	return config;
};
