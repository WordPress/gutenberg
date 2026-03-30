/**
 * External dependencies
 */
import { describe, expect, test } from '@jest/globals';

/**
 * Internal dependencies
 */
import { createCssString } from '../create-css-string';

describe( 'createCssString', () => {
	test.each`
		description                    | input                | expected
		${ 'empty string' }            | ${ '' }              | ${ '""' }
		${ 'simple ASCII' }            | ${ 'Arial' }         | ${ '"Arial"' }
		${ 'spaces preserved' }        | ${ 'Exo 2' }         | ${ '"Exo 2"' }
		${ 'leading/trailing spaces' } | ${ '  Arial  ' }     | ${ '"  Arial  "' }
		${ 'whitespace-only' }         | ${ '   ' }           | ${ '"   "' }
		${ 'numbers pass through' }    | ${ '12345' }         | ${ '"12345"' }
		${ 'non-ASCII passthrough' }   | ${ 'café' }          | ${ '"café"' }
		${ 'backslash' }               | ${ 'Back\\Slash' }   | ${ '"Back\\5C Slash"' }
		${ 'double backslash' }        | ${ '\\\\' }          | ${ '"\\5C \\5C "' }
		${ 'backslash before quote' }  | ${ "a\\'b" }         | ${ '"a\\5C \\27 b"' }
		${ 'null byte' }               | ${ 'a\0b' }          | ${ '"a�b"' }
		${ 'LF' }                      | ${ 'a\nb' }          | ${ '"a\\A b"' }
		${ 'CR' }                      | ${ 'a\rb' }          | ${ '"a\\A b"' }
		${ 'CRLF as single escape' }   | ${ 'a\r\nb' }        | ${ '"a\\A b"' }
		${ 'form feed' }               | ${ 'a\fb' }          | ${ '"a\\A b"' }
		${ 'HTML characters < > &' }   | ${ 'a<b>c&d' }       | ${ '"a\\3C b\\3E c\\26 d"' }
		${ 'CSS syntax , ; { }' }      | ${ 'a,b;c{d}' }      | ${ '"a\\2C b\\3B c\\7B d\\7D "' }
		${ 'single quote' }            | ${ "CSS's strings" } | ${ '"CSS\\27 s strings"' }
		${ 'double quote' }            | ${ 'Say "Hi"' }      | ${ '"Say \\22 Hi\\22 "' }
	`( '$description', ( { input, expected } ) => {
		expect( createCssString( input ) ).toBe( expected );
	} );
} );
