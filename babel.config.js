module.exports = ( api ) => {
	api.cache( true );

	return {
		presets: [ '@wordpress/babel-preset-default' ],
		plugins: [
			'@emotion/babel-plugin',
			'babel-plugin-inline-json-import',
			// TODO: It should get included only in development mode when hot module replacement is used.
			'react-refresh/babel',
		],
		overrides: [
			{
				test: 'packages/block-library/src/index.js',
				plugins: [
					require.resolve( '@wordpress/block-library/babel-plugin' ),
				],
			},
		],
	};
};
