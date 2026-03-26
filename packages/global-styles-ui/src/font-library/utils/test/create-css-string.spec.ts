/**
 * Internal dependencies
 */
import { createCssString } from '../create-css-string';

describe( 'createCssString', () => {
	it.each`
		description                    | input              | expected
		${ 'simple name' }             | ${ 'Arial' }       | ${ '"Arial"' }
		${ 'leading/trailing spaces' } | ${ '  Arial  ' }   | ${ '"  Arial  "' }
		${ 'single quote (the bug)' }  | ${ "O'Brien" }     | ${ '"O\\27 Brien"' }
		${ 'double quote' }            | ${ 'Say "Hi"' }    | ${ '"Say \\22 Hi\\22 "' }
		${ 'backslash' }               | ${ 'Back\\Slash' } | ${ '"Back\\5C Slash"' }
		${ 'backslash before quote' }  | ${ "a\\'b" }       | ${ '"a\\5C \\27 b"' }
		${ 'null char → U+FFFD' }      | ${ 'a\0b' }        | ${ '"a�b"' }
		${ 'line feed' }               | ${ 'a\nb' }        | ${ '"a\\A b"' }
		${ 'carriage return' }         | ${ 'a\rb' }        | ${ '"a\\A b"' }
		${ 'CRLF as single escape' }   | ${ 'a\r\nb' }      | ${ '"a\\A b"' }
		${ 'form feed' }               | ${ 'a\fb' }        | ${ '"a\\A b"' }
		${ 'HTML characters < > &' }   | ${ 'a<b>c&d' }     | ${ '"a\\3C b\\3E c\\26 d"' }
		${ 'CSS syntax , ; { }' }      | ${ 'a,b;c{d}' }    | ${ '"a\\2C b\\3B c\\7B d\\7D "' }
		${ 'empty string' }            | ${ '' }            | ${ '""' }
		${ 'whitespace-only' }         | ${ '   ' }         | ${ '"   "' }
		${ 'spaces are not escaped' }  | ${ 'Exo 2' }       | ${ '"Exo 2"' }
	`(
		'$description',
		( { input, expected }: { input: string; expected: string } ) => {
			expect( createCssString( input ) ).toBe( expected );
		}
	);
} );
