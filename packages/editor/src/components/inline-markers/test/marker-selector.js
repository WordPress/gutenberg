import { getMarkerSelector } from '../marker-selector';

describe( 'getMarkerSelector', () => {
	it( 'matches a marker by class token and id attribute', () => {
		expect( getMarkerSelector( 'wp-note', 'data-id', 12 ) ).toBe(
			'mark.wp-note[data-id="12"]'
		);
		expect(
			getMarkerSelector( 'wp-suggestion', 'data-suggestion-id', 12 )
		).toBe( 'mark.wp-suggestion[data-suggestion-id="12"]' );
	} );

	it( 'leaves a numeric id readable rather than identifier-escaped', () => {
		// `CSS.escape` would render 7 as `\37 `, which matches but makes every
		// generated rule unreadable.
		expect( getMarkerSelector( 'wp-note', 'data-id', 7 ) ).toBe(
			'mark.wp-note[data-id="7"]'
		);
	} );

	it( 'escapes characters that would break out of the attribute value', () => {
		expect( getMarkerSelector( 'wp-note', 'data-id', 'a"b' ) ).toBe(
			'mark.wp-note[data-id="a\\"b"]'
		);
		expect( getMarkerSelector( 'wp-note', 'data-id', 'a\\b' ) ).toBe(
			'mark.wp-note[data-id="a\\\\b"]'
		);
		expect( getMarkerSelector( 'wp-note', 'data-id', 'a\nb' ) ).toBe(
			'mark.wp-note[data-id="a\\a b"]'
		);
	} );
} );
