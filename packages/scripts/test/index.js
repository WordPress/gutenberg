test( 'should leave webpack.config.js untouched', () => {
	expect(
		require( '@wordpress/scripts/config/webpack.config' )
	).toMatchSnapshot();
} );
