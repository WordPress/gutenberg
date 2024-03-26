/**
 * Internal dependencies
 */
import { createURL } from '../create-url';
import { WP_BASE_URL } from '../shared/config';

describe( 'createURL', () => {
	it( 'called with empty string, should return WP_BASE_URL', async () => {
		expect( createURL( '' ) ).toEqual( WP_BASE_URL + '/' );
	} );

	it( 'when given relative path, should parse it relatively to the base', async () => {
		expect( createURL( '/foo' ) ).toEqual( WP_BASE_URL + '/foo' );
	} );

	it( 'when given query string, should append to the URL', async () => {
		expect( createURL( '', '?bar=baz&fiz=a/b/c' ) ).toEqual(
			WP_BASE_URL + '/?bar=baz&fiz=a/b/c'
		);
		expect( createURL( '/foo', '?bar=baz&fiz=a/b/c' ) ).toEqual(
			WP_BASE_URL + '/foo?bar=baz&fiz=a/b/c'
		);
	} );

	it( 'when given absolute path, should parse it relatively to the base', async () => {
		const baseURL = new URL( WP_BASE_URL );
		expect( createURL( '//www.example.com/bar' ) ).toEqual(
			baseURL.protocol + '//www.example.com/bar'
		);
	} );
} );
