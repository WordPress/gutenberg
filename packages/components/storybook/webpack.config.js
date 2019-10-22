module.exports = ( { config } ) => {
	config.module.rules.push( {
		test: /\/stories\/.+\.js$/,
		loaders: [ require.resolve( '@storybook/source-loader' ) ],
		enforce: 'pre',
	} );

	return config;
};
