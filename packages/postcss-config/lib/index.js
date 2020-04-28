/**
 * WordPress dependencies
 */
const { adminColorSchemes } = require( '@wordpress/base-styles' );

module.exports = {
	plugins: () => [
		require( '@wordpress/postcss-themes' )( adminColorSchemes ),
		require( 'autoprefixer' )( { grid: true } ),
		require( 'postcss-color-function' ),
	],
};
