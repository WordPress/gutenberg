/**
 * Internal dependencies
 */
import { createURL } from '../create-url';
import { WP_BASE_URL } from '../shared/config';

describe( 'createURL', () => {
	it( 'called without arguments, should return WP_BASE_URL', async () => {
		expect( createURL() ).toEqual( WP_BASE_URL + '/' );
	} );

	it( 'when given relative path, should parse it relatively to the base', async () => {
		expect( createURL( '/foo' ) ).toEqual( WP_BASE_URL + '/foo' );
	} );

	it( 'when given query, should escape it and append to the URL', async () => {
		// String
		expect( createURL( '', '?bar=baz&fiz=a/b/c' ) ).toEqual(
			WP_BASE_URL + '/?bar=baz&fiz=a%2Fb%2Fc'
		);
		// String without `?`
		expect( createURL( '/foo', 'bar=baz&fiz=a/b/c' ) ).toEqual(
			WP_BASE_URL + '/foo?bar=baz&fiz=a%2Fb%2Fc'
		);
		// Object
		expect( createURL( '/foo', { bar: 'baz', fiz: 'a/b/c' } ) ).toEqual(
			WP_BASE_URL + '/foo?bar=baz&fiz=a%2Fb%2Fc'
		);
		// Array
		expect(
			createURL( '/foo', [
				[ 'bar', 'baz' ],
				[ 'fiz', 'a/b/c' ],
			] )
		).toEqual( WP_BASE_URL + '/foo?bar=baz&fiz=a%2Fb%2Fc' );
	} );

	it( 'when given query and a path that already contains one, should merge both to the URL, overwriting any if overlap', async () => {
		// ? in both
		expect( createURL( '/?foo=bar', '?bar=baz&fiz=a/b/c' ) ).toEqual(
			WP_BASE_URL + '/?foo=bar&bar=baz&fiz=a%2Fb%2Fc'
		);
		// overwrite
		expect( createURL( '/foo?bar=foo', '?bar=baz&fiz=a/b/c' ) ).toEqual(
			WP_BASE_URL + '/foo?bar=baz&fiz=a%2Fb%2Fc'
		);
		// query without ?
		expect( createURL( '/?a=b', '?bar=baz&fiz=a/b/c' ) ).toEqual(
			WP_BASE_URL + '/?a=b&bar=baz&fiz=a%2Fb%2Fc'
		);
		// overwrite without ?
		expect( createURL( '/foo?bar=foo', '?bar=baz&fiz=a/b/c' ) ).toEqual(
			WP_BASE_URL + '/foo?bar=baz&fiz=a%2Fb%2Fc'
		);
	} );

	it( 'when given absolute path, should parse it relatively to the base', async () => {
		const baseURL = new URL( WP_BASE_URL );
		expect( createURL( '//www.example.com/bar' ) ).toEqual(
			baseURL.protocol + '//www.example.com/bar'
		);
	} );
} );
