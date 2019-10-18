module.exports = ( { config } ) => {
	config.module.rules.push( {
		test: /\/stories\/.+\.js$/,
		loaders: [ require.resolve( '@storybook/source-loader' ) ],
		enforce: 'pre',
	},
	{
		test: /\.scss$/,
		loaders: [
			require.resolve( 'style-loader' ),
			require.resolve( 'css-loader' ),
			require.resolve( 'sass-loader' ),
		],
	}
	);

	return config;
};
