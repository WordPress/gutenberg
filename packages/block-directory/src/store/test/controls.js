/**
 * Internal dependencies
 */
import { loadScript, loadStyle } from '../controls';

describe( 'controls', () => {
	const assets = [
		'http://www.wordpress.org/plugins/fakeasset.js',
		'http://www.wordpress.org/plugins/fakeasset.css',
	];

	describe( 'loadScript', () => {
		it( 'should return a Promise when loading a script', () => {
			const result = loadScript( assets[ 0 ] );
			expect( typeof result.then ).toBe( 'function' );
		} );

		it( 'should reject when no script is given', async () => {
			expect.assertions( 1 );
			const result = loadScript( '' );
			await expect( result ).rejects.toThrow( Error );
		} );
	} );

	describe( 'loadStyle', () => {
		it( 'should return a Promise when loading a style', () => {
			const result = loadStyle( assets[ 1 ] );
			expect( typeof result.then ).toBe( 'function' );
		} );

		it( 'should reject when no style is given', async () => {
			expect.assertions( 1 );
			const result = loadStyle( '' );
			await expect( result ).rejects.toThrow( Error );
		} );
	} );
} );
