module.exports = function( api ) {
	api.cache( true );

	return {
		presets: [ '@wordpress/babel-preset-default' ],
		plugins: [
			'lodash',
			'babel-plugin-emotion',
			'babel-plugin-inline-json-import',
		],
	};
};
