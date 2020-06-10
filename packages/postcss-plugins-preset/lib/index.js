/**
 * WordPress dependencies
 */
const { adminColorSchemes } = require( '@wordpress/base-styles' );

module.exports = [
	require( 'postcss-custom-properties' )(),
	require( '@wordpress/postcss-themes' )( adminColorSchemes ),
	require( 'autoprefixer' )( { grid: true } ),
	require( 'postcss-color-function' ),
];
