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

	it( 'stops injecting into documents after cleanup', () => {
		const iframeDocument = document.implementation.createHTMLDocument();
		const cleanup = registerDocument( iframeDocument );

		cleanup();
		registerStyle( 'test-style', '.test-class{color:red;}' );

		expect( iframeDocument.head.childElementCount ).toBe( 0 );
	} );
} );
