/**
 * Internal dependencies
 */
import { isPathSupported, shouldEnableCaching } from '../api-fetch-setup';

const supportedPaths = [
	'wp/v2/media/54?context=edit&_locale=user',
	'wp/v2/media/5?context=edit',
	'wp/v2/media/54/',
	'wp/v2/media/',
	'wp/v2/media?context=edit&_locale=user',
	'wp/v2/categories/',
	'wp/v2/blocks/28?_locale=user',
	'/wp/v2/blocks?per_page=100&context=edit&_locale=user',
];

const unsupportedPaths = [
	'wp/v1/media/', // made up example
];

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
	supportedPaths.forEach( ( path ) => {
		it( `supports ${ path }`, () => {
			expect( isPathSupported( path ) ).toBe( true );
		} );
	} );

	unsupportedPaths.forEach( ( path ) => {
		it( `does not support ${ path }`, () => {
			expect( isPathSupported( path ) ).toBe( false );
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
