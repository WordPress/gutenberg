import { afterEach, describe, expect, it } from 'vitest';
import { registerDocument, registerStyle } from '../src';

type GlobalScopeWithStyleRuntime = typeof globalThis & {
	__wpStyleRuntime?: unknown;
};

describe( 'style runtime', () => {
	const globalScope = globalThis as GlobalScopeWithStyleRuntime;

	afterEach( () => {
		delete globalScope.__wpStyleRuntime;
		document.head.innerHTML = '';
	} );

	it( 'injects registered styles into the root document', () => {
		registerStyle( 'test-style', '.test-class{color:red;}' );

		expect( document.head.innerHTML ).toBe(
			'<style data-wp-hash="test-style">.test-class{color:red;}</style>'
		);
	} );

	it( 'replays registered styles into newly registered documents', () => {
		registerStyle( 'test-style', '.test-class{color:red;}' );

		const iframeDocument = document.implementation.createHTMLDocument();
		registerDocument( iframeDocument );

		expect( iframeDocument.head.innerHTML ).toBe(
			'<style data-wp-hash="test-style">.test-class{color:red;}</style>'
		);
	} );

	it( 'injects future styles into all registered documents', () => {
		const iframeDocument = document.implementation.createHTMLDocument();
		registerDocument( iframeDocument );

		registerStyle( 'test-style', '.test-class{color:red;}' );

		expect( iframeDocument.head.innerHTML ).toBe(
			'<style data-wp-hash="test-style">.test-class{color:red;}</style>'
		);
	} );

	it( 'deduplicates styles by hash', () => {
		registerStyle( 'test-style', '.test-class{color:red;}' );
		registerStyle( 'test-style', '.test-class{color:red;}' );

		expect(
			document.head.querySelectorAll( 'style[data-wp-hash="test-style"]' )
		).toHaveLength( 1 );
	} );

	it( 'deduplicates styles with hashes that are not selector-safe', () => {
		const hash = 'test-style"]\\';
		registerStyle( hash, '.test-class{color:red;}' );
		registerStyle( hash, '.test-class{color:red;}' );

		const styles = document.head.querySelectorAll( 'style[data-wp-hash]' );

		expect( styles ).toHaveLength( 1 );
		expect( styles[ 0 ] ).toHaveAttribute( 'data-wp-hash', hash );
	} );

	it( 'deduplicates against existing style tags injected after a document is registered', () => {
		const iframeDocument = document.implementation.createHTMLDocument();
		registerDocument( iframeDocument );
		registerStyle( 'test-style', '.test-class{color:red;}' );

		const existingStyle = iframeDocument.createElement( 'style' );
		existingStyle.setAttribute( 'data-wp-hash', 'legacy-style' );
		existingStyle.appendChild(
			iframeDocument.createTextNode( '.legacy-class{color:blue;}' )
		);
		iframeDocument.head.appendChild( existingStyle );

		registerStyle( 'legacy-style', '.legacy-class{color:blue;}' );

		expect(
			iframeDocument.head.querySelectorAll( 'style[data-wp-hash]' )
		).toHaveLength( 2 );
	} );

	describe( 'nonce', () => {
		it( 'does not add a nonce by default', () => {
			const iframeDocument = document.implementation.createHTMLDocument();
			registerDocument( iframeDocument );
			registerStyle( 'test-style', '.test-class{color:red;}' );

			expect( iframeDocument.head.innerHTML ).toBe(
				'<style data-wp-hash="test-style">.test-class{color:red;}</style>'
			);
		} );

		it( 'adds the nonce to styles replayed into the document', () => {
			registerStyle( 'test-style', '.test-class{color:red;}' );

			const iframeDocument = document.implementation.createHTMLDocument();
			registerDocument( iframeDocument, { nonce: 'test-nonce' } );

			expect( iframeDocument.head.innerHTML ).toBe(
				'<style data-wp-hash="test-style" nonce="test-nonce">.test-class{color:red;}</style>'
			);
		} );

		it( 'adds the nonce to styles registered later', () => {
			const iframeDocument = document.implementation.createHTMLDocument();
			registerDocument( iframeDocument, { nonce: 'test-nonce' } );
			registerStyle( 'test-style', '.test-class{color:red;}' );

			expect( iframeDocument.head.innerHTML ).toBe(
				'<style data-wp-hash="test-style" nonce="test-nonce">.test-class{color:red;}</style>'
			);
		} );

		it( 'replaces styles that were injected before the nonce was set', () => {
			// The root document is registered as soon as the first style is,
			// before any provider can pass a nonce.
			registerStyle( 'test-style', '.test-class{color:red;}' );
			const injectedStyle = document.head.querySelector( 'style' );

			registerDocument( document, { nonce: 'test-nonce' } );

			expect( document.head.innerHTML ).toBe(
				'<style data-wp-hash="test-style" nonce="test-nonce">.test-class{color:red;}</style>'
			);
			expect( document.head.querySelector( 'style' ) ).not.toBe(
				injectedStyle
			);
		} );

		it( 'leaves style tags it did not register alone', () => {
			const otherStyle = document.createElement( 'style' );
			otherStyle.setAttribute( 'data-wp-hash', 'other-style' );
			document.head.appendChild( otherStyle );

			registerDocument( document, { nonce: 'test-nonce' } );

			expect( document.head.querySelector( 'style' ) ).toBe( otherStyle );
			expect( otherStyle ).not.toHaveAttribute( 'nonce' );
		} );

		it( 'keeps the nonce when the document is registered again without one', () => {
			const iframeDocument = document.implementation.createHTMLDocument();
			registerDocument( iframeDocument, { nonce: 'test-nonce' } );
			registerDocument( iframeDocument );
			registerStyle( 'test-style', '.test-class{color:red;}' );

			expect( iframeDocument.head.innerHTML ).toBe(
				'<style data-wp-hash="test-style" nonce="test-nonce">.test-class{color:red;}</style>'
			);
		} );
	} );

	it( 'stops injecting into documents after cleanup', () => {
		const iframeDocument = document.implementation.createHTMLDocument();
		const cleanup = registerDocument( iframeDocument );

		cleanup();
		registerStyle( 'test-style', '.test-class{color:red;}' );

		expect( iframeDocument.head.childElementCount ).toBe( 0 );
	} );
} );
