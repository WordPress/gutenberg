const preset = require( '@wordpress/jest-preset-default' );

describe( '@wordpress/jest-preset-default', () => {
	it( 'exposes the Jest preset when required by package name', () => {
		expect( preset ).toMatchObject( {
			testEnvironment: 'jsdom',
		} );
	} );
} );
