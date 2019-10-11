const themes = require( '../../packages/base-styles/themes' );

module.exports = [
	require( '@wordpress/postcss-themes' )( themes ),
	require( 'autoprefixer' )( { grid: true } ),
	require( 'postcss-color-function' ),
];
