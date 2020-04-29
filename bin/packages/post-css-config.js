const { adminColorSchemes } = require( '@wordpress/base-styles' );

module.exports = [
	require( '@wordpress/postcss-themes' )( adminColorSchemes ),
	require( 'autoprefixer' )( { grid: true } ),
];
