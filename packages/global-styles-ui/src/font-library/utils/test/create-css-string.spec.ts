import { createCssString } from '../create-css-string';

describe( 'createCssString', () => {
	test.each`
		description                      | input                | expected
		${ 'empty string' }              | ${ '' }              | ${ '""' }
		${ 'simple ASCII' }              | ${ 'Arial' }         | ${ '"Arial"' }
		${ 'spaces escaped' }            | ${ 'Exo 2' }         | ${ '"Exo\\0000202"' }
		${ 'leading/trailing spaces' }   | ${ '  Arial  ' }     | ${ '"\\000020\\000020Arial\\000020\\000020"' }
		${ 'whitespace-only' }           | ${ '   ' }           | ${ '"\\000020\\000020\\000020"' }
		${ 'leading digit escaped' }     | ${ '12345' }         | ${ '"\\0000312345"' }
		${ 'non-ASCII passthrough' }     | ${ 'café' }          | ${ '"café"' }
		${ 'backslash' }                 | ${ 'Back\\Slash' }   | ${ '"Back\\00005CSlash"' }
		${ 'double backslash' }          | ${ '\\\\' }          | ${ '"\\00005C\\00005C"' }
		${ 'backslash before quote' }    | ${ "a\\'b" }         | ${ '"a\\00005C\\000027b"' }
		${ 'null byte' }                 | ${ 'a\0b' }          | ${ '"a�b"' }
		${ 'LF' }                        | ${ 'a\nb' }          | ${ '"a\\00000Ab"' }
		${ 'CR' }                        | ${ 'a\rb' }          | ${ '"a\\00000Ab"' }
		${ 'CRLF as single escape' }     | ${ 'a\r\nb' }        | ${ '"a\\00000Ab"' }
		${ 'form feed' }                 | ${ 'a\fb' }          | ${ '"a\\00000Ab"' }
		${ 'tab' }                       | ${ 'a\tb' }          | ${ '"a\\000009b"' }
		${ 'HTML characters < > &' }     | ${ 'a<b>c&d' }       | ${ '"a\\00003Cb\\00003Ec\\000026d"' }
		${ 'CSS syntax , ; { }' }        | ${ 'a,b;c{d}' }      | ${ '"a\\00002Cb\\00003Bc\\00007Bd\\00007D"' }
		${ 'single quote' }              | ${ "CSS's strings" } | ${ '"CSS\\000027s\\000020strings"' }
		${ 'double quote' }              | ${ 'Say "Hi"' }      | ${ '"Say\\000020\\000022Hi\\000022"' }
		${ 'percent, digit first' }      | ${ '100% Sans' }     | ${ '"\\00003100\\000025\\000020Sans"' }
		${ 'percent-encoded octet' }     | ${ '%26' }           | ${ '"\\00002526"' }
		${ 'ident-invalid punctuation' } | ${ 'know?' }         | ${ '"know\\00003F"' }
		${ 'leading hyphen + digit' }    | ${ '-3D' }           | ${ '"\\00002D3D"' }
		${ 'leading hyphen + letter' }   | ${ '-Font' }         | ${ '"-Font"' }
	`( '$description', ( { input, expected } ) => {
		expect( createCssString( input ) ).toBe( expected );
	} );

	test( 'docblock example', () => {
		const value = 'CSS & a "<style>" tag\'s strings';
		const expected =
			'"CSS\\000020\\000026\\000020a\\000020\\000022\\00003Cstyle\\00003E\\000022\\000020tag\\000027s\\000020strings"';

		expect( createCssString( value ) ).toBe( expected );
	} );

	test( 'produces no character rewritten by server-side sanitization', () => {
		// The stored value must be a fixed point of WordPress's
		// `sanitize_text_field()` / `sanitize_font_family()`: no literal
		// whitespace, "<", or "%"-prefixed hex octets, and nothing to trim.
		const result = createCssString(
			'"Ephesis" font with <special \\> {chars} & 100%2 things, ya\'know?\t\r\n'
		);
		expect( result ).not.toMatch( /[\s<%]/ );
		expect( result.startsWith( '"' ) ).toBe( true );
		expect( result.endsWith( '"' ) ).toBe( true );
	} );

	test( 'produces a valid unquoted CSS identifier sequence', () => {
		// WordPress's font-face printer re-emits the value without the
		// surrounding quotes, so the content must remain a valid identifier
		// sequence: six-digit escapes and identifier-safe literals only,
		// not starting with a digit or a hyphen followed by a digit.
		const names = [
			'"Ephesis" font with <special \\> {chars} & things, ya\'know?',
			'100% Sans',
			'12345',
			'-3D Font',
			'x; src: url(https://evil.example/x.woff2)',
		];
		for ( const name of names ) {
			const content = createCssString( name ).slice( 1, -1 );
			expect( content ).toMatch(
				/^(\\[0-9A-F]{6}|[A-Za-z0-9_\u0080-\uFFFF-])*$/
			);
			expect( content ).not.toMatch( /^([0-9]|-[0-9]|-$)/ );
		}
	} );
} );
