module.exports = [
	require( 'autoprefixer' )( { grid: true } ),
	require( 'postcss-modules' )( {
		scopeBehaviour: 'global',
		getJSON: () => {},
	} ),
];
