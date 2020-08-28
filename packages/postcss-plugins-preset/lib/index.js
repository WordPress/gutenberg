module.exports = [
	require( 'postcss-custom-properties' )( {
		importFrom: [
			{
				customProperties: {
					'--wp-admin-theme-color': '#007cba',
					'--wp-admin-theme-color-darker-10': '#006ba1',
					'--wp-admin-theme-color-darker-20': '#005a87',
				},
			},
		],
	} ),
	require( 'autoprefixer' )( { grid: true } ),
];
