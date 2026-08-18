import { formatFontFaceName } from '../preview-styles';
import { createCssString } from '../create-css-string';

describe( 'formatFontFaceName', () => {
	test.each`
		description                     | input                                    | expected
		${ 'empty input' }              | ${ '' }                                  | ${ '' }
		${ 'plain name' }               | ${ 'Open Sans' }                         | ${ 'Open Sans' }
		${ 'quoted name' }              | ${ '"Open Sans"' }                       | ${ 'Open Sans' }
		${ 'single-quoted list' }       | ${ "'Open Sans', sans-serif" }           | ${ 'Open Sans' }
		${ 'leading empty list item' }  | ${ ", 'Open Sans', 'Helvetica', serif" } | ${ 'Open Sans' }
		${ 'six-digit escape' }         | ${ '"O\\000027Reilly\\000020Sans"' }     | ${ "O'Reilly Sans" }
		${ 'short escape, terminated' } | ${ 'Exo\\20 2' }                         | ${ 'Exo 2' }
		${ 'escaped literal' }          | ${ 'know\\?' }                           | ${ 'know?' }
		${ 'null code point' }          | ${ '"a\\000000b"' }                      | ${ 'a�b' }
		${ 'out-of-range code point' }  | ${ '"a\\FFFFFFb"' }                      | ${ 'a�b' }
		${ 'surrogate code point' }     | ${ '"a\\00D800b"' }                      | ${ 'a�b' }
	`( '$description', ( { input, expected } ) => {
		expect( formatFontFaceName( input ) ).toBe( expected );
	} );

	test( 'round-trips createCssString output back to the plain name', () => {
		const names = [
			"O'Reilly Sans",
			'Exo 2',
			'"Ephesis" font with <special \\> {chars} & things, ya\'know?',
			'Tom & Jerry',
			'100% Sans',
			'明朝体',
			'café',
		];
		for ( const name of names ) {
			expect( formatFontFaceName( createCssString( name ) ) ).toBe(
				name
			);
		}
	} );
} );
