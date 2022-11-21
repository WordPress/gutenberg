/**
 * Internal dependencies
 */
const DependencyExtractionWebpackPlugin = require( '../lib/index' );

describe( 'DependencyExtractionWebpackPlugin', () => {
	test( 'should have .bundledPackages static property', () => {
		expect( DependencyExtractionWebpackPlugin ).toHaveProperty(
			'bundledPackages',
			[ '@wordpress/icons', '@wordpress/interface' ]
		);
	} );
} );
