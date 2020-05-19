/**
 * Internal dependencies
 */
import { loadScript, loadStyle } from '../controls';

describe( 'controls', () => {
	const scriptAsset = 'http://www.wordpress.org/plugins/fakeasset.js';
	const styleAsset = 'http://www.wordpress.org/plugins/fakeasset.css';

	describe( 'loadScript', () => {
		it( 'should return a Promise when loading a script', () => {
			const result = loadScript( scriptAsset );
			expect( typeof result.then ).toBe( 'function' );
		} );

		it( 'should reject when no script is given', async () => {
			expect.assertions( 1 );
			const result = loadScript( '' );
			await expect( result ).rejects.toThrow( Error );
		} );

		it( 'should reject when a non-js file is given', async () => {
			const result = loadScript( styleAsset );
			await expect( result ).rejects.toThrow( Error );
		} );
	} );

	describe( 'loadStyle', () => {
		it( 'should return a Promise when loading a style', () => {
			const result = loadStyle( styleAsset );
			expect( typeof result.then ).toBe( 'function' );
		} );

		it( 'should reject when no style is given', async () => {
			expect.assertions( 1 );
			const result = loadStyle( '' );
			await expect( result ).rejects.toThrow( Error );
		} );

		it( 'should reject when a non-css file is given', async () => {
			const result = loadStyle( scriptAsset );
			await expect( result ).rejects.toThrow( Error );
		} );
	} );
} );
