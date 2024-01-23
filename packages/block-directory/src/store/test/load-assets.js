/**
 * Internal dependencies
 */
import { loadAsset } from '../load-assets';

describe( 'controls', () => {
	describe( 'loadAsset', () => {
		const script = document.createElement( 'script' );
		const style = document.createElement( 'link' );

		it( 'should return a Promise when loading a script', () => {
			const result = loadAsset( script );
			expect( typeof result.then ).toBe( 'function' );
		} );

		it( 'should return a Promise when loading a style', () => {
			const result = loadAsset( style );
			expect( typeof result.then ).toBe( 'function' );
		} );
	} );
} );
