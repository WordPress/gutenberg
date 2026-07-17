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

	it( 'stops injecting into documents after cleanup', () => {
		const iframeDocument = document.implementation.createHTMLDocument();
		const cleanup = registerDocument( iframeDocument );

		cleanup();
		registerStyle( 'test-style', '.test-class{color:red;}' );

		expect( iframeDocument.head.childElementCount ).toBe( 0 );
	} );
} );
