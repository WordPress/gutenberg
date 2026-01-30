/**
 * Internal dependencies
 */
import { buildRestUrl } from '../build-rest-url';

// Extend Window interface for wpApiSettings.
declare global {
	interface Window {
		wpApiSettings?: { root?: string };
	}
}

describe( 'buildRestUrl', () => {
	const originalWpApiSettings = window.wpApiSettings;

	afterEach( () => {
		// Restore wpApiSettings after each test.
		if ( originalWpApiSettings === undefined ) {
			delete window.wpApiSettings;
		} else {
			window.wpApiSettings = originalWpApiSettings;
		}
	} );

	it( 'should return the path with _locale=user when no wpApiSettings', () => {
		delete window.wpApiSettings;

		const result = buildRestUrl( '/wp/v2/media' );

		expect( result ).toBe( '/wp/v2/media?_locale=user' );
	} );

	it( 'should combine API root with path and add _locale=user', () => {
		window.wpApiSettings = {
			root: 'https://example.com/wp-json/',
		};

		const result = buildRestUrl( '/wp/v2/media' );

		expect( result ).toBe(
			'https://example.com/wp-json/wp/v2/media?_locale=user'
		);
	} );

	it( 'should handle path with existing query parameters', () => {
		window.wpApiSettings = {
			root: 'https://example.com/wp-json/',
		};

		const result = buildRestUrl( '/wp/v2/media?_embed=wp:featuredmedia' );

		expect( result ).toBe(
			'https://example.com/wp-json/wp/v2/media?_embed=wp:featuredmedia&_locale=user'
		);
	} );

	it( 'should handle plain permalinks (API root with query string)', () => {
		window.wpApiSettings = {
			root: 'https://example.com/?rest_route=/',
		};

		const result = buildRestUrl( '/wp/v2/media?_embed=wp:featuredmedia' );

		// The ? in the path should become & when root already has ?.
		expect( result ).toBe(
			'https://example.com/?rest_route=/wp/v2/media&_embed=wp:featuredmedia&_locale=user'
		);
	} );

	it( 'should handle plain permalinks with simple path', () => {
		window.wpApiSettings = {
			root: 'https://example.com/?rest_route=/',
		};

		const result = buildRestUrl( '/wp/v2/media' );

		expect( result ).toBe(
			'https://example.com/?rest_route=/wp/v2/media&_locale=user'
		);
	} );

	it( 'should handle subdirectory installs', () => {
		window.wpApiSettings = {
			root: 'https://example.com/blog/wp-json/',
		};

		const result = buildRestUrl( '/wp/v2/media' );

		expect( result ).toBe(
			'https://example.com/blog/wp-json/wp/v2/media?_locale=user'
		);
	} );

	it( 'should handle path without leading slash', () => {
		window.wpApiSettings = {
			root: 'https://example.com/wp-json/',
		};

		const result = buildRestUrl( 'wp/v2/media' );

		expect( result ).toBe(
			'https://example.com/wp-json/wp/v2/media?_locale=user'
		);
	} );
} );
