import { afterEach, describe, expect, it } from 'vitest';
import { loadAsset } from '../load-assets';

describe( 'controls', () => {
	describe( 'loadAsset', () => {
		const script = document.createElement( 'script' );
		const style = document.createElement( 'link' );

		afterEach( () => {
			document.body.innerHTML = '';
		} );

		it( 'should return a Promise when loading a script', () => {
			const result = loadAsset( script );
			expect( typeof result.then ).toBe( 'function' );
		} );

		it( 'should return a Promise when loading a style', () => {
			const result = loadAsset( style );
			expect( typeof result.then ).toBe( 'function' );
		} );

		it( 'should mirror a loaded stylesheet into the editor canvas iframe', () => {
			const iframe = document.createElement( 'iframe' );
			iframe.setAttribute( 'name', 'editor-canvas' );
			document.body.appendChild( iframe );

			const stylesheet = document.createElement( 'link' );
			stylesheet.id = 'my-block-style';
			stylesheet.rel = 'stylesheet';
			stylesheet.href = 'https://example.com/my-block/style.css';

			loadAsset( stylesheet );

			const mirrored =
				iframe.contentDocument.getElementById( 'my-block-style' );
			expect( mirrored ).not.toBeNull();
			// Assert on properties (not jest-dom matchers): the mirrored node
			// lives in the iframe's document, so it is not an instance of the
			// top window's HTMLElement.
			expect( mirrored.rel ).toBe( 'stylesheet' );
			expect( mirrored.href ).toBe(
				'https://example.com/my-block/style.css'
			);
		} );

		it( 'should not inject a stylesheet the editor canvas already has', () => {
			const iframe = document.createElement( 'iframe' );
			iframe.setAttribute( 'name', 'editor-canvas' );
			document.body.appendChild( iframe );

			const existing = iframe.contentDocument.createElement( 'link' );
			existing.id = 'my-block-style';
			existing.rel = 'stylesheet';
			iframe.contentDocument.head.appendChild( existing );

			const stylesheet = document.createElement( 'link' );
			stylesheet.id = 'my-block-style';
			stylesheet.rel = 'stylesheet';
			stylesheet.href = 'https://example.com/my-block/style.css';

			loadAsset( stylesheet );

			const stylesheets = iframe.contentDocument.querySelectorAll(
				'link#my-block-style'
			);
			expect( stylesheets ).toHaveLength( 1 );
			expect( stylesheets[ 0 ] ).toBe( existing );
		} );

		it( 'should not mirror a stylesheet when the canvas is not iframed', () => {
			const stylesheet = document.createElement( 'link' );
			stylesheet.id = 'my-block-style';
			stylesheet.rel = 'stylesheet';
			stylesheet.href = 'https://example.com/my-block/style.css';

			expect( () => loadAsset( stylesheet ) ).not.toThrow();
		} );

		it( 'should not mirror a script into the editor canvas iframe', () => {
			const iframe = document.createElement( 'iframe' );
			iframe.setAttribute( 'name', 'editor-canvas' );
			document.body.appendChild( iframe );

			loadAsset( script );

			expect(
				iframe.contentDocument.querySelectorAll( 'script' )
			).toHaveLength( 0 );
		} );
	} );
} );
