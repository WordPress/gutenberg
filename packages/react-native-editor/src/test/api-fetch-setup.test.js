/**
 * Internal dependencies
 */
import { isPathSupported } from '../api-fetch-setup';

const supportedPaths = [
	'wp/v2/media/54?context=edit&_locale=user',
	'wp/v2/media/5?context=edit',
	'wp/v2/media/54/',
	'wp/v2/media/',
	'wp/v2/media?context=edit&_locale=user',
	'wp/v2/categories/',
];

const unsupportedPaths = [
	'wp/v1/media/', // made up example
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
