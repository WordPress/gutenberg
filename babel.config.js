module.exports = ( api ) => {
	api.cache( true );

	return {
		presets: [ '@wordpress/babel-preset-default' ],
		plugins: [
			'@emotion/babel-plugin',
			'babel-plugin-inline-json-import',
			require.resolve( '@shopify/web-worker/babel' ),
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
