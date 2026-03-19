/**
 * Internal dependencies
 */
import { escape, sanitizeLanguage, toHTMLStr, parseFencedCode } from '../utils';

describe( 'core/code', () => {
	describe( 'escape()', () => {
		it( 'should escape opening square brackets', () => {
			const text = escape( '[shortcode][/shortcode]' );
			expect( text ).toBe( '&#91;shortcode]&#91;/shortcode]' );
		} );

		it( 'should escape the protocol of an isolated url', () => {
			const text = escape( 'https://example.com/test/' );
			expect( text ).toBe( 'https:&#47;&#47;example.com/test/' );
		} );

		it( 'should not escape the protocol of a non isolated url', () => {
			const text = escape( 'Text https://example.com/test/' );
			expect( text ).toBe( 'Text https://example.com/test/' );
		} );
	} );

	describe( 'sanitizeLanguage()', () => {
		it( 'should strip leading and trailing whitespace', () => {
			expect( sanitizeLanguage( '  php  ' ) ).toBe( 'php' );
		} );

		it( 'should remove internal whitespace', () => {
			expect( sanitizeLanguage( 'type script' ) ).toBe( 'typescript' );
		} );

		it( 'should strip a leading language- prefix', () => {
			expect( sanitizeLanguage( 'language-php' ) ).toBe( 'php' );
		} );

		it( 'should strip a leading language- prefix case-insensitively', () => {
			expect( sanitizeLanguage( 'LANGUAGE-JavaScript' ) ).toBe(
				'JavaScript'
			);
		} );

		it( 'should strip whitespace and language- prefix together', () => {
			expect( sanitizeLanguage( '  language-css  ' ) ).toBe( 'css' );
		} );

		it( 'should return an empty string for an empty input', () => {
			expect( sanitizeLanguage( '' ) ).toBe( '' );
		} );
	} );

	describe( 'toHTMLStr()', () => {
		it( 'should return a plain string unchanged', () => {
			expect( toHTMLStr( 'hello world' ) ).toBe( 'hello world' );
		} );

		it( 'should return an empty string for null', () => {
			expect( toHTMLStr( null ) ).toBe( '' );
		} );

		it( 'should return an empty string for undefined', () => {
			expect( toHTMLStr( undefined ) ).toBe( '' );
		} );

		it( 'should call toHTMLString with preserveWhiteSpace on a RichTextData-like object', () => {
			const mockRichText = {
				toHTMLString: jest
					.fn()
					.mockReturnValue( '<strong>bold</strong>' ),
			};
			const result = toHTMLStr( mockRichText );
			expect( mockRichText.toHTMLString ).toHaveBeenCalledWith( {
				preserveWhiteSpace: true,
			} );
			expect( result ).toBe( '<strong>bold</strong>' );
		} );
	} );

	describe( 'parseFencedCode()', () => {
		it( 'should return null for non-fenced input', () => {
			expect( parseFencedCode( 'just a plain paragraph' ) ).toBeNull();
		} );

		it( 'should return null when the opening fence has no language', () => {
			expect( parseFencedCode( '```\nsome code\n```' ) ).toBeNull();
		} );

		it( 'should parse a basic fenced code block', () => {
			const parsed = parseFencedCode( '```js\nconsole.log( 1 );\n```' );

			expect( parsed ).toEqual( {
				content: 'console.log( 1 );',
				language: 'js',
			} );
		} );

		it( 'should parse an opening fence with spaces before the language', () => {
			const parsed = parseFencedCode( '```   php\n<?php echo 1;\n```' );

			expect( parsed ).toEqual( {
				content: '<?php echo 1;',
				language: 'php',
			} );
		} );

		it( 'should parse an opening fence with tabs before the language', () => {
			const parsed = parseFencedCode(
				'```\t\tjs\nconsole.log( 1 );\n```'
			);

			expect( parsed ).toEqual( {
				content: 'console.log( 1 );',
				language: 'js',
			} );
		} );

		it( 'should strip a language- prefix from the info string', () => {
			const parsed = parseFencedCode(
				'```language-php\n<?php echo 1;\n```'
			);

			expect( parsed ).toEqual( {
				content: '<?php echo 1;',
				language: 'php',
			} );
		} );

		it( 'should strip a closing fence without a trailing newline', () => {
			const parsed = parseFencedCode( '```js\nconsole.log( 1 );\n```' );

			expect( parsed ).toEqual( {
				content: 'console.log( 1 );',
				language: 'js',
			} );
		} );

		it( 'should strip a closing fence followed by a final newline', () => {
			const parsed = parseFencedCode( '```js\nconsole.log( 1 );\n```\n' );

			expect( parsed ).toEqual( {
				content: 'console.log( 1 );',
				language: 'js',
			} );
		} );

		it( 'should preserve content when no closing fence is present', () => {
			const parsed = parseFencedCode( '```js\nconsole.log( 1 );' );

			expect( parsed ).toEqual( {
				content: 'console.log( 1 );',
				language: 'js',
			} );
		} );

		it( 'should handle CRLF line endings', () => {
			const parsed = parseFencedCode(
				'```js\r\nconsole.log( 1 );\r\n```'
			);

			expect( parsed ).toEqual( {
				content: 'console.log( 1 );',
				language: 'js',
			} );
		} );

		it( 'should accept end-of-string as the fence terminator when allowEndOfString is true', () => {
			const parsed = parseFencedCode( '```js', {
				allowEndOfString: true,
			} );

			expect( parsed ).toEqual( {
				content: '',
				language: 'js',
			} );
		} );

		it( 'should return null without a trailing newline when allowEndOfString is false', () => {
			expect( parseFencedCode( '```js' ) ).toBeNull();
		} );
	} );
} );
