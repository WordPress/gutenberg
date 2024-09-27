module.exports = ( api ) => {
	const isTest = api.env( 'test' );
	api.cache( true );

	return {
		presets: [ '@wordpress/babel-preset-default' ],
		plugins: [
			'@emotion/babel-plugin',
			'babel-plugin-inline-json-import',
			! isTest && require.resolve( '@shopify/web-worker/babel' ),
		].filter( Boolean ),
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
