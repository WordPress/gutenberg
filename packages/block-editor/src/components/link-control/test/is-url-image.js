/**
 * Internal dependencies
 */
import isImageUrl from '../is-url-image';

describe( 'isImageUrl', () => {
	// use .each to test multiple cases
	it.each( [
		[ true, 'https://example.com/image.jpg' ],
		[ true, 'https://example.com/image.gif' ],
		[ true, 'https://example.com/image.png' ],
		[ true, 'https://example.com/image.webp' ],
		[ true, 'https://example.com/image.jpeg' ],
		[ true, 'https://example.com/image.JPG' ],
		[ false, 'https://example.com/image.txt' ],
		[ false, 'https://example.com/image' ],
		[ false, 'https://example.com/image.jpg?query=123' ],
		[ false, '' ],
		[ false, null ],
		[ false, undefined ],
		[ false, 123 ],
	] )(
		'returns %s when testing against URL "%s" for a valid image',
		( expected, testString ) => {
			expect( isImageUrl( testString ) ).toBe( expected );
		}
	);
} );
