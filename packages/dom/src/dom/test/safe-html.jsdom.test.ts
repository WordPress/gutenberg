import { describe, expect, it } from 'vitest';
import safeHTML from '../safe-html';

describe( 'safeHTML', () => {
	it( 'should strip on* attributes', () => {
		const input = '<img src="" onerror="alert(\'1\')" onload="">';
		const output = '<img src="">';
		expect( safeHTML( input ) ).toBe( output );
	} );

	it( 'should strip on* attributes with spacing', () => {
		const input = '<img src="" onerror = "alert(\'1\')" onload = "">';
		const output = '<img src="">';
		expect( safeHTML( input ) ).toBe( output );
	} );

	it( 'should strip nested on* attributes', () => {
		const input =
			'<p><strong><img src="" onerror="alert(\'1\')"></strong></p>';
		const output = '<p><strong><img src=""></strong></p>';
		expect( safeHTML( input ) ).toBe( output );
	} );

	it( 'should strip script tags', () => {
		const input = '<script>alert("1")</script><script></script>';
		const output = '';
		expect( safeHTML( input ) ).toBe( output );
	} );

	it( 'should strip svg script tags', () => {
		expect( safeHTML( '<svg><script>alert(1)</script></svg>' ) ).toBe(
			'<svg></svg>'
		);
	} );

	it.each( [ 'object', 'embed', 'base', 'meta', 'noscript' ] )(
		'should strip %s elements',
		( tagName ) => {
			expect( safeHTML( `<p>Text</p><${ tagName }>` ) ).toBe(
				'<p>Text</p>'
			);
		}
	);

	it.each( [
		[ 'a', 'href', 'javascript:alert(1)' ],
		[ 'a', 'href', ' JavaScript:alert(1)' ],
		[ 'a', 'href', 'java\tscript:alert(1)' ],
		[ 'a', 'href', '\u0001javascript:alert(1)' ],
		[ 'form', 'action', 'javascript:alert(1)' ],
		[ 'button', 'formaction', 'javascript:alert(1)' ],
	] )( 'should strip script URLs from %s %s: %j', ( tagName, key, value ) => {
		const element = document.createElement( tagName );
		element.setAttribute( key, value );

		expect( safeHTML( element.outerHTML ) ).toBe(
			`<${ tagName }></${ tagName }>`
		);
	} );

	it( 'should strip script URLs from svg animations', () => {
		expect(
			safeHTML(
				'<svg><a><animate attributeName="href" values="x;javascript:alert(1)"></animate></a></svg>'
			)
		).toBe( '<svg><a><animate attributeName="href"></animate></a></svg>' );
	} );

	it( 'should keep regular URLs', () => {
		const input = '<a href="https://example.com/javascript:">Link</a>';
		expect( safeHTML( input ) ).toBe( input );
	} );

	it( 'should sandbox iframes with a srcdoc', () => {
		expect(
			safeHTML(
				'<iframe src="https://example.com" srcdoc="Text"></iframe>'
			)
		).toBe(
			'<iframe src="https://example.com" srcdoc="Text" sandbox="allow-scripts allow-presentation"></iframe>'
		);
	} );

	it( 'should replace the sandbox of iframes that need one', () => {
		expect(
			safeHTML(
				'<iframe sandbox="allow-scripts allow-same-origin" srcdoc="Text"></iframe>'
			)
		).toBe(
			'<iframe sandbox="allow-scripts allow-presentation" srcdoc="Text"></iframe>'
		);
	} );

	it( 'should sandbox iframes with a script URL', () => {
		expect(
			safeHTML( '<iframe src="javascript:alert(1)"></iframe>' )
		).toBe(
			'<iframe sandbox="allow-scripts allow-presentation"></iframe>'
		);
	} );

	it( 'should sandbox same-origin iframes', () => {
		expect(
			safeHTML( `<iframe src="${ window.location.origin }/a"></iframe>` )
		).toContain( 'sandbox="allow-scripts allow-presentation"' );
		expect( safeHTML( '<iframe src="/wp-admin/"></iframe>' ) ).toContain(
			'sandbox="allow-scripts allow-presentation"'
		);
	} );

	it( 'should keep cross-origin iframes as they are', () => {
		const input =
			'<iframe src="https://example.com/embed" allowfullscreen=""></iframe>';
		expect( safeHTML( input ) ).toBe( input );
	} );

	it( 'should not hide attributes behind named form controls', () => {
		for ( const name of [ 'attributes', 'getAttributeNames', 'tagName' ] ) {
			expect(
				safeHTML( `<form onclick="1"><input name="${ name }"></form>` )
			).toBe( `<form><input name="${ name }"></form>` );
		}
	} );

	it( 'should not let markup mutate into elements after it is checked', () => {
		const sanitizedOutput = safeHTML(
			'<form><math><mtext></form><form><mglyph><style></math><img src onerror=alert(1)>'
		);
		const { body } = document.implementation.createHTMLDocument( '' );
		body.innerHTML = sanitizedOutput;

		expect( body.querySelector( '[onerror]' ) ).toBeNull();
	} );

	it( 'should not let noscript hide elements', () => {
		expect(
			safeHTML(
				'<noscript><style></noscript><img src=x onerror=alert(1)></style></noscript>'
			)
		).not.toContain( 'onerror' );
	} );
} );
