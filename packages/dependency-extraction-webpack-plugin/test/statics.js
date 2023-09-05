/**
 * Internal dependencies
 */
const DependencyExtractionWebpackPlugin = require( '../lib/index' );

describe( 'DependencyExtractionWebpackPlugin', () => {
	test( 'should have .excludedExternals static property', () => {
		expect( DependencyExtractionWebpackPlugin ).toHaveProperty(
			'excludedExternals',
			[ '@wordpress/icons', '@wordpress/interface' ]
		);
	} );
} );
