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

const unsupportedPaths = {
	GET: [
		'wp/v1/media/', // Made up example.
	],
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
} );
