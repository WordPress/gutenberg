module.exports = [
	require( 'postcss-import' )(),
	require( 'autoprefixer' )( {
		grid: true,
		overrideBrowserslist: require( '@wordpress/browserslist-config' ),
	} ),
];
