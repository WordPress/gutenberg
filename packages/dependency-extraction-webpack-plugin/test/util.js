/**
 * Internal dependencies
 */
const {
	defaultRequestToExternal,
	defaultRequestToHandle,
} = require( '../util' );

describe( 'defaultRequestToExternal', () => {
	test( 'Returns undefined on unrecognized request', () => {
		expect( defaultRequestToExternal( 'unknown-request' ) ).toBeUndefined();
	} );

	test( 'Handles known lodash-es request', () => {
		expect( defaultRequestToExternal( 'lodash-es' ) ).toBe( 'lodash' );
	} );

	test( 'Handles known @wordpress request', () => {
		expect( defaultRequestToExternal( '@wordpress/i18n' ) ).toEqual( [
			'wp',
			'i18n',
		] );
	} );

	test( 'Handles future @wordpress namespace packages', () => {
		expect(
			defaultRequestToExternal( '@wordpress/some-future-package' )
		).toEqual( [ 'wp', 'someFuturePackage' ] );
	} );
} );

describe( 'defaultRequestToHandle', () => {
	test( 'Handles known lodash-es request', () => {
		expect( defaultRequestToHandle( 'lodash-es' ) ).toBe( 'lodash' );
	} );

	test( 'Handles known @wordpress request', () => {
		expect( defaultRequestToHandle( '@wordpress/i18n' ) ).toBe( 'wp-i18n' );
	} );

	test( 'Handles  @wordpress request', () => {
		expect(
			defaultRequestToHandle( '@wordpress/some-future-package' )
		).toBe( 'wp-some-future-package' );
	} );
} );
