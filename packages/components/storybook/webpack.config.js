module.exports = function( { config } ) {
	config.module.rules.push( {
		test: /stories\/index.jsx?$/,
		loaders: [ require.resolve( '@storybook/source-loader' ) ],
		enforce: 'pre',
	} );

	return config;
};
