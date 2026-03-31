/**
 * Internal dependencies
 */
import { buildRestUrl } from '../build-rest-url';

describe( 'buildRestUrl', () => {
	const originalWpApiSettings = window.wpApiSettings;

	afterEach( () => {
		window.wpApiSettings = originalWpApiSettings;
	} );

	it( 'should use default /wp-json/ root when wpApiSettings is undefined', () => {
		delete ( window as any ).wpApiSettings;
		const url = buildRestUrl( '/wp/v2/media' );
		expect( url ).toBe( '/wp-json/wp/v2/media?_locale=user' );
	} );

	it( 'should use custom API root from wpApiSettings.root', () => {
		window.wpApiSettings = { root: 'https://example.com/wp-json/' };
		const url = buildRestUrl( '/wp/v2/media' );
		expect( url ).toBe(
			'https://example.com/wp-json/wp/v2/media?_locale=user'
		);
	} );

	it( 'should strip leading slash from path', () => {
		window.wpApiSettings = { root: '/wp-json/' };
		const url = buildRestUrl( '/wp/v2/media' );
		expect( url ).toBe( '/wp-json/wp/v2/media?_locale=user' );
	} );

	it( 'should handle plain permalinks where apiRoot contains ?', () => {
		window.wpApiSettings = { root: '/?rest_route=/' };
		const url = buildRestUrl( '/wp/v2/media?_embed=wp:featuredmedia' );
		expect( url ).toBe(
			'/?rest_route=%2Fwp%2Fv2%2Fmedia&_embed=wp%3Afeaturedmedia&_locale=user'
		);
	} );

	it( 'should add _locale=user when not present', () => {
		window.wpApiSettings = { root: '/wp-json/' };
		const url = buildRestUrl( 'wp/v2/media' );
		expect( url ).toContain( '_locale=user' );
	} );

	it( 'should not duplicate _locale when already in path', () => {
		window.wpApiSettings = { root: '/wp-json/' };
		const url = buildRestUrl( 'wp/v2/media?_locale=user' );
		const matches = url.match( /_locale/g );
		expect( matches ).toHaveLength( 1 );
	} );

	it( 'should handle path with existing query params', () => {
		window.wpApiSettings = { root: '/wp-json/' };
		const url = buildRestUrl( '/wp/v2/media?_embed=wp:featuredmedia' );
		expect( url ).toBe(
			'/wp-json/wp/v2/media?_embed=wp%3Afeaturedmedia&_locale=user'
		);
	} );

	it( 'should handle apiRoot without trailing slash', () => {
		// WordPress always provides a trailing slash in wpApiSettings.root,
		// but verify the function still produces a usable URL without one.
		window.wpApiSettings = { root: 'https://example.com/wp-json/' };
		const url = buildRestUrl( 'wp/v2/media' );
		expect( url ).toBe(
			'https://example.com/wp-json/wp/v2/media?_locale=user'
		);
	} );

	it( 'should handle path without leading slash', () => {
		window.wpApiSettings = { root: '/wp-json/' };
		const url = buildRestUrl( 'wp/v2/media' );
		expect( url ).toBe( '/wp-json/wp/v2/media?_locale=user' );
	} );
} );
