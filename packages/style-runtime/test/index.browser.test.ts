import { afterEach, describe, expect, it } from 'vitest';
import { registerDocument, registerStyle } from '../src';

type GlobalScopeWithStyleRuntime = typeof globalThis & {
	__wpStyleRuntime?: unknown;
};

const NONCE = 'test-nonce';
const RED = 'rgb(255, 0, 0)';

/**
 * Renders an iframe whose Content Security Policy only allows styles with
 * the test nonce.
 *
 * @return The iframe document and the element the test styles target.
 */
async function renderIframeWithStrictCSP() {
	const iframe = document.createElement( 'iframe' );
	iframe.srcdoc = `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="style-src 'nonce-${ NONCE }'"></head><body><div class="nonce-test-target"></div></body></html>`;

	const loaded = new Promise( ( resolve ) =>
		iframe.addEventListener( 'load', resolve, { once: true } )
	);
	document.body.appendChild( iframe );
	await loaded;

	const iframeDocument = iframe.contentDocument!;
	return {
		iframeDocument,
		target: iframeDocument.querySelector( '.nonce-test-target' )!,
	};
}

function getColor( element: Element ) {
	return element.ownerDocument.defaultView!.getComputedStyle( element ).color;
}

describe( 'style runtime with a Content Security Policy', () => {
	const globalScope = globalThis as GlobalScopeWithStyleRuntime;

	afterEach( () => {
		delete globalScope.__wpStyleRuntime;
		document
			.querySelectorAll( 'iframe, style[data-wp-hash^="nonce-test"]' )
			.forEach( ( element ) => element.remove() );
	} );

	it( 'blocks injected styles without a nonce', async () => {
		const { iframeDocument, target } = await renderIframeWithStrictCSP();

		registerDocument( iframeDocument );
		registerStyle( 'nonce-test-blocked', `.nonce-test-target{color:red}` );

		expect( getColor( target ) ).not.toBe( RED );
	} );

	it( 'applies injected styles that carry the nonce', async () => {
		const { iframeDocument, target } = await renderIframeWithStrictCSP();

		registerDocument( iframeDocument, { nonce: NONCE } );
		registerStyle( 'nonce-test-allowed', `.nonce-test-target{color:red}` );

		expect( getColor( target ) ).toBe( RED );
	} );

	it( 'applies styles that were injected before the nonce was set', async () => {
		const { iframeDocument, target } = await renderIframeWithStrictCSP();

		registerDocument( iframeDocument );
		registerStyle( 'nonce-test-replaced', `.nonce-test-target{color:red}` );
		expect( getColor( target ) ).not.toBe( RED );

		registerDocument( iframeDocument, { nonce: NONCE } );

		expect( getColor( target ) ).toBe( RED );
	} );
} );
