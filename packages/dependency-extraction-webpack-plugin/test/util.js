/**
 * Internal dependencies
 */
const {
	camelCaseDash,
	defaultRequestToExternal,
	defaultRequestToHandle,
} = require( '../lib/util' );

describe( 'camelCaseDash', () => {
	test( 'does not change a single word', () => {
		expect( camelCaseDash( 'blocks' ) ).toBe( 'blocks' );
		expect( camelCaseDash( 'dom' ) ).toBe( 'dom' );
	} );

	test( 'does not capitalize letters following numbers', () => {
		expect( camelCaseDash( 'a11y' ) ).toBe( 'a11y' );
		expect( camelCaseDash( 'i18n' ) ).toBe( 'i18n' );
	} );

	test( 'converts dashes into camel case', () => {
		expect( camelCaseDash( 'api-fetch' ) ).toBe( 'apiFetch' );
		expect( camelCaseDash( 'list-reusable-blocks' ) ).toBe(
			'listReusableBlocks'
		);
	} );
} );

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

	test( 'Handles react request', () => {
		expect( defaultRequestToExternal( 'react' ) ).toBe( 'React' );
	} );

	test( 'Handles react-dom request', () => {
		expect( defaultRequestToExternal( 'react-dom' ) ).toBe( 'ReactDOM' );
	} );

	test( 'Handles react-dom/client request', () => {
		expect( defaultRequestToExternal( 'react-dom/client' ) ).toBe(
			'ReactDOM'
		);
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

	test( 'Handles react request', () => {
		expect( defaultRequestToHandle( 'react' ) ).toBeUndefined();
	} );

	test( 'Handles react-dom request', () => {
		expect( defaultRequestToHandle( 'react-dom' ) ).toBeUndefined();
	} );

	test( 'Handles react-dom/client request', () => {
		expect( defaultRequestToHandle( 'react-dom/client' ) ).toBe(
			'react-dom'
		);
	} );
} );
