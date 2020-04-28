/**
 * WordPress dependencies
 */
const { adminColorSchemes } = require( '@wordpress/base-styles' );
const postcssThemes = require( '@wordpress/postcss-themes' );

module.exports = [
	postcssThemes( adminColorSchemes ),
	require( 'autoprefixer' )( { grid: true } ),
	require( 'postcss-color-function' ),
];
