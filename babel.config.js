module.exports = function( api ) {
	api.cache( true );

	return {
		presets: [ '@wordpress/babel-preset-default', '@emotion/babel-preset-css-prop' ],
		plugins: [
			'babel-plugin-emotion',
			'babel-plugin-inline-json-import',
		],
	};
};
