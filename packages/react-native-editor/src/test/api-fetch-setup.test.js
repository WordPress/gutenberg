/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
/**
 * Internal dependencies
 */
import { isPathSupported, shouldEnableCaching } from '../api-fetch-setup';

const supportedPaths = {
	GET: [
		'wp/v2/media/54?context=edit&_locale=user',
		'wp/v2/media/5?context=edit',
		'wp/v2/media/54/',
		'wp/v2/media/',
		'wp/v2/media?context=edit&_locale=user',
		'wp/v2/categories/',
		'wp/v2/blocks/28?_locale=user',
		'/wp/v2/blocks?per_page=100&context=edit&_locale=user',
	],
};

// Made up examples.
const unsupportedPaths = {
	GET: [ 'wp/v1/media/' ],
	POST: [ 'wp/v2/categories' ],
};

const enabledCachingPaths = [
	'wp/v2/media/54?context=edit&_locale=user',
	'wp/v2/media/5?context=edit',
	'wp/v2/media/54/',
	'wp/v2/media/',
	'wp/v2/media?context=edit&_locale=user',
	'wp/v2/categories/',
];

const disabledCachingPaths = [
	'wp/v2/blocks/28?_locale=user',
	'/wp/v2/blocks?per_page=100&context=edit&_locale=user',
];

describe( 'isPathSupported', () => {
	describe( 'GET requests', () => {
		supportedPaths.GET.forEach( ( path ) => {
			it( `supports ${ path }`, () => {
				expect( isPathSupported( path, 'GET' ) ).toBe( true );
			} );
		} );

		unsupportedPaths.GET.forEach( ( path ) => {
			it( `does not support ${ path }`, () => {
				expect( isPathSupported( path, 'GET' ) ).toBe( false );
			} );
		} );
	} );

	describe( 'POST requests', () => {
		unsupportedPaths.POST.forEach( ( path ) => {
			it( `does not support ${ path }`, () => {
				expect( isPathSupported( path, 'POST' ) ).toBe( false );
			} );
		} );
	} );

	it( 'checks supported endpoints provided by WP hook', () => {
		addFilter(
			'native.supported_endpoints',
			'gutenberg-mobile',
			( endpoints ) => {
				return {
					GET: [ ...endpoints.GET, /test\/get-endpoint/i ],
					POST: [ ...endpoints.POST, /test\/post-endpoint/i ],
				};
			}
		);
		expect( isPathSupported( 'test/get-endpoint', 'GET' ) ).toBe( true );
		expect( isPathSupported( 'test/post-endpoint', 'POST' ) ).toBe( true );
		expect( isPathSupported( 'test/bad-endpoint', 'GET' ) ).toBe( false );
		expect( isPathSupported( 'test/bad-endpoint', 'POST' ) ).toBe( false );
	} );
} );

describe( 'shouldEnableCaching', () => {
	enabledCachingPaths.forEach( ( path ) => {
		it( `enables caching for ${ path }`, () => {
			expect( shouldEnableCaching( path ) ).toBe( true );
		} );
	} );

	disabledCachingPaths.forEach( ( path ) => {
		it( `does not enable caching for ${ path }`, () => {
			expect( shouldEnableCaching( path ) ).toBe( false );
		} );
	} );

	it( 'does not enable caching for endpoints provided to filter', () => {
		addFilter(
			'native.disabled_caching_endpoints',
			'gutenberg-mobile',
			( endpoints ) => {
				return [ ...endpoints, /wp\/v2\/categories/i ];
			}
		);

		// Filter was used to stop caching an endpoint from `enabledCachingPaths` array.
		expect( shouldEnableCaching( 'wp/v2/categories' ) ).toBe( false );
	} );
} );
