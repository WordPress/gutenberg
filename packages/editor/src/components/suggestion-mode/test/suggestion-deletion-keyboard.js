/**
 * WordPress dependencies
 */
import { RichTextData } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { sliceValueToHTML } from '../suggestion-deletion-keyboard';

describe( 'sliceValueToHTML', () => {
	it( 'serializes a plain slice', () => {
		expect( sliceValueToHTML( 'Hello world', 6, 11 ) ).toBe( 'world' );
	} );

	it( 'keeps inline formatting inside the slice', () => {
		const value = RichTextData.fromHTMLString(
			'Hello <strong>bold</strong> world'
		);
		// "bold world" spans the formatted run and trailing text.
		expect( sliceValueToHTML( value, 6, 16 ) ).toBe(
			'<strong>bold</strong> world'
		);
	} );

	it( 'clips formatting that extends past the slice', () => {
		const value = RichTextData.fromHTMLString(
			'a <em>emphasized run</em> z'
		);
		// Slice covers only part of the <em> run: the emphasis survives on
		// the covered part.
		expect( sliceValueToHTML( value, 2, 7 ) ).toBe( '<em>empha</em>' );
	} );

	it( 'keeps link formatting and attributes', () => {
		const value = RichTextData.fromHTMLString(
			'go <a href="https://w.org">here</a> now'
		);
		expect( sliceValueToHTML( value, 3, 7 ) ).toBe(
			'<a href="https://w.org">here</a>'
		);
	} );

	it( 'returns an empty string for non-string-like values', () => {
		expect( sliceValueToHTML( undefined, 0, 2 ) ).toBe( '' );
		expect( sliceValueToHTML( null, 0, 2 ) ).toBe( '' );
		expect( sliceValueToHTML( 42, 0, 2 ) ).toBe( '' );
	} );
} );
