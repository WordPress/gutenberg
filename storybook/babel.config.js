/**
 * Babel configuration for Storybook.
 *
 * This file ensures that babel-loader can find the correct presets
 * when running under pnpm's strict isolation mode.
 */
module.exports = ( api ) => {
	api.cache( true );

	return {
		presets: [ '@wordpress/babel-preset-default' ],
		plugins: [ '@emotion/babel-plugin', 'babel-plugin-inline-json-import' ],
	};
};
