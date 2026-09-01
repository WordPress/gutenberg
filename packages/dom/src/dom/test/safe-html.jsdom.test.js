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

	it( 'should strip dangerous executable tags (iframe, object, embed)', () => {
		const input =
			'<iframe src="https://example.com"></iframe><object data="test.swf"></object><embed src="test.swf"><p>Safe</p>';
		const output = '<p>Safe</p>';
		expect( safeHTML( input ) ).toBe( output );
	} );

	it( 'should strip javascript: and vbscript: URIs from href attributes', () => {
		const input =
			'<a href="javascript:alert(1)">Link 1</a><a href="vbscript:msgbox(1)">Link 2</a><a href="https://example.com">Safe Link</a>';
		const output = '<a>Link 1</a><a>Link 2</a><a href="https://example.com">Safe Link</a>';
		expect( safeHTML( input ) ).toBe( output );
	} );

	it( 'should strip javascript: URIs with leading whitespace and control characters', () => {
		const input =
			'<a href="   javascript:alert(1)">Link 1</a><a href="\x01javascript:alert(2)">Link 2</a>';
		const output = '<a>Link 1</a><a>Link 2</a>';
		expect( safeHTML( input ) ).toBe( output );
	} );

	it( 'should strip javascript: URIs from src, action, and formaction attributes', () => {
		const input =
			'<form action="javascript:alert(1)"><button formaction="javascript:alert(2)">Submit</button></form><img src="javascript:alert(3)">';
		const output =
			'<form><button>Submit</button></form><img>';
		expect( safeHTML( input ) ).toBe( output );
	} );

	it( 'should strip executable data: URIs (HTML/SVG)', () => {
		const input =
			'<a href="data:text/html,<script>alert(1)</script>">Link</a><a href="data:image/svg+xml,<svg onload=alert(1)>">SVG Link</a>';
		const output = '<a>Link</a><a>SVG Link</a>';
		expect( safeHTML( input ) ).toBe( output );
	} );

	it( 'should preserve safe URLs and attributes', () => {
		const input =
			'<a href="https://wordpress.org" target="_blank" rel="noopener noreferrer">WordPress</a><img src="/images/logo.png" alt="Logo">';
		const output =
			'<a href="https://wordpress.org" target="_blank" rel="noopener noreferrer">WordPress</a><img src="/images/logo.png" alt="Logo">';
		expect( safeHTML( input ) ).toBe( output );
	} );
} );
