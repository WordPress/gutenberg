/**
 * External dependencies
 */
import { describe, expect, it } from '@jest/globals';

/**
 * Internal dependencies
 */
import {
	htmlIndexToRichTextOffset,
	richTextOffsetToHtmlIndex,
} from '../crdt-utils';

describe( 'htmlIndexToRichTextOffset', () => {
	it( 'returns the index unchanged when there are no tags', () => {
		expect( htmlIndexToRichTextOffset( 'hello world', 5 ) ).toBe( 5 );
	} );

	it( 'returns 0 for index 0', () => {
		expect(
			htmlIndexToRichTextOffset( '<strong>bold</strong> text', 0 )
		).toBe( 0 );
	} );

	it( 'skips a simple opening tag', () => {
		// "<strong>bold</strong> text"
		// HTML index 8 = first char of "bold" (right after <strong>)
		expect(
			htmlIndexToRichTextOffset( '<strong>bold</strong> text', 8 )
		).toBe( 0 );
	} );

	it( 'counts text characters inside a tag', () => {
		// "<strong>bold</strong> text"
		// HTML index 10 = 'l' in "bold" (after "bo")
		// Text: "bold text", offset should be 2
		expect(
			htmlIndexToRichTextOffset( '<strong>bold</strong> text', 10 )
		).toBe( 2 );
	} );

	it( 'skips closing tags', () => {
		// "<strong>bold</strong> text"
		// HTML index 21 = ' ' (the space after </strong>)
		// Text: "bold text", offset should be 4
		expect(
			htmlIndexToRichTextOffset( '<strong>bold</strong> text', 21 )
		).toBe( 4 );
	} );

	it( 'handles text before a tag', () => {
		// "some <strong>words</strong> test"
		// HTML index 3 = 'e' in "some"
		expect(
			htmlIndexToRichTextOffset( 'some <strong>words</strong> test', 3 )
		).toBe( 3 );
	} );

	it( 'handles an index right before a tag', () => {
		// "some <strong>words</strong> test"
		// HTML index 5 = '<' of <strong>
		expect(
			htmlIndexToRichTextOffset( 'some <strong>words</strong> test', 5 )
		).toBe( 5 );
	} );

	it( 'handles an index right after an opening tag', () => {
		// "some <strong>words</strong> test"
		// HTML index 13 = 'w' of "words" (right after <strong>)
		expect(
			htmlIndexToRichTextOffset( 'some <strong>words</strong> test', 13 )
		).toBe( 5 );
	} );

	it( 'handles an index at the end of formatted text', () => {
		// "some <strong>words</strong> test"
		// HTML index 18 = '<' of </strong>
		// Text offset should be 10 ("some words")
		expect(
			htmlIndexToRichTextOffset( 'some <strong>words</strong> test', 18 )
		).toBe( 10 );
	} );

	it( 'handles an index after the closing tag', () => {
		// "some <strong>words</strong> test"
		// HTML index 27 = ' ' after </strong>
		expect(
			htmlIndexToRichTextOffset( 'some <strong>words</strong> test', 27 )
		).toBe( 10 );
	} );

	it( 'handles the end of the string', () => {
		const html = 'some <strong>words</strong> test';
		expect( htmlIndexToRichTextOffset( html, html.length ) ).toBe( 15 );
	} );

	it( 'handles nested tags', () => {
		// "a<strong><em>b</em></strong>c"
		// Text: "abc"
		// HTML index 13 = 'b' (after <strong><em>)
		expect(
			htmlIndexToRichTextOffset( 'a<strong><em>b</em></strong>c', 13 )
		).toBe( 1 );
		// HTML index 28 = 'c' (after </strong>)
		expect(
			htmlIndexToRichTextOffset( 'a<strong><em>b</em></strong>c', 28 )
		).toBe( 2 );
	} );

	it( 'handles tags with attributes', () => {
		// '<a href="https://example.com">link</a> text'
		// HTML index 30 = 'l' in "link"
		expect(
			htmlIndexToRichTextOffset(
				'<a href="https://example.com">link</a> text',
				30
			)
		).toBe( 0 );
	} );

	it( 'handles HTML entity &amp;', () => {
		// "Tom &amp; Jerry"
		// Text: "Tom & Jerry" (11 chars)
		// HTML index 4 = '&' start of &amp;
		expect( htmlIndexToRichTextOffset( 'Tom &amp; Jerry', 4 ) ).toBe( 4 );
		// HTML index 9 = ' ' after &amp;
		expect( htmlIndexToRichTextOffset( 'Tom &amp; Jerry', 9 ) ).toBe( 5 );
	} );

	it( 'handles HTML entity &lt;', () => {
		// "a &lt; b"
		// Text: "a < b" (5 chars)
		// HTML index 2 = '&' start of &lt;
		expect( htmlIndexToRichTextOffset( 'a &lt; b', 2 ) ).toBe( 2 );
		// HTML index 6 = ' ' after &lt;
		expect( htmlIndexToRichTextOffset( 'a &lt; b', 6 ) ).toBe( 3 );
	} );

	it( 'handles numeric character references', () => {
		// "a&#38;b" (&#38; = &)
		// Text: "a&b" (3 chars)
		// HTML index 1 = '&' start of &#38;
		expect( htmlIndexToRichTextOffset( 'a&#38;b', 1 ) ).toBe( 1 );
		// HTML index 6 = 'b'
		expect( htmlIndexToRichTextOffset( 'a&#38;b', 6 ) ).toBe( 2 );
	} );

	// These tests document the behavior when htmlIndex lands inside an
	// HTML tag or entity, possible from non-synced peers. The marker is
	// inserted at the raw index, which may break the HTML, but create()
	// produces a best-effort parse. Pinning the current behavior here so
	// any future changes are intentional.

	it( 'handles an htmlIndex pointing inside an opening tag', () => {
		// "some <strong>words</strong> test"
		// HTML index 7 = 'n' inside <strong>
		// The marker breaks the tag, so create() treats the broken
		// fragments as text. The marker position in the resulting
		// (corrupted) text happens to equal the raw htmlIndex.
		const result = htmlIndexToRichTextOffset(
			'some <strong>words</strong> test',
			7
		);
		expect( typeof result ).toBe( 'number' );
		expect( result ).toBe( 7 );
	} );

	it( 'handles an htmlIndex pointing inside a closing tag', () => {
		// "some <strong>words</strong> test"
		// HTML index 20 = 't' inside </strong>
		// Same as above, the broken closing tag becomes text.
		const result = htmlIndexToRichTextOffset(
			'some <strong>words</strong> test',
			20
		);
		expect( typeof result ).toBe( 'number' );
		expect( result ).toBe( 20 );
	} );

	it( 'handles an htmlIndex pointing inside an entity', () => {
		// "Tom &amp; Jerry"
		// HTML index 6 = 'p' inside &amp;
		// The broken entity is not parsed, so the raw text including
		// the marker is preserved and the position equals htmlIndex.
		const result = htmlIndexToRichTextOffset( 'Tom &amp; Jerry', 6 );
		expect( typeof result ).toBe( 'number' );
		expect( result ).toBe( 6 );
	} );

	it( 'handles self-closing tags like <br />', () => {
		// "line1<br />line2"
		// Gutenberg's rich-text treats <br> as a line separator character,
		// so text = "line1\u2028line2" (11 chars). HTML index 11 = 'l' of
		// "line2" → rich-text offset 6 (after "line1" + line separator).
		expect( htmlIndexToRichTextOffset( 'line1<br />line2', 11 ) ).toBe( 6 );
	} );

	it( 'handles multiple adjacent tags', () => {
		// "<em><strong>text</strong></em>"
		// HTML index 12 = 't' (after <em><strong>)
		expect(
			htmlIndexToRichTextOffset( '<em><strong>text</strong></em>', 12 )
		).toBe( 0 );
	} );

	it( 'handles empty content', () => {
		expect( htmlIndexToRichTextOffset( '', 0 ) ).toBe( 0 );
	} );

	it( 'handles tag attribute containing ">" inside quotes', () => {
		// '<a title="a>b">link</a>'
		// The DOM parser correctly handles > inside quoted attributes.
		// HTML index 15 = 'l' in "link", rich-text offset = 0.
		const html = '<a title="a>b">link</a>';
		const result = htmlIndexToRichTextOffset( html, 15 );
		expect( result ).toBe( 0 );
	} );
} );

describe( 'richTextOffsetToHtmlIndex', () => {
	it( 'returns the offset unchanged when there are no tags', () => {
		expect( richTextOffsetToHtmlIndex( 'hello world', 5 ) ).toBe( 5 );
	} );

	it( 'returns position after the opening tag for offset 0 with tags', () => {
		// Rich-text offset 0 = 'b' → HTML index 8 (after <strong>)
		expect(
			richTextOffsetToHtmlIndex( '<strong>bold</strong> text', 0 )
		).toBe( 8 );
	} );

	it( 'maps offset inside a formatted word', () => {
		// "some <strong>words</strong> test"
		// Rich-text offset 5 = 'w' → HTML index 13 (after <strong>)
		expect(
			richTextOffsetToHtmlIndex( 'some <strong>words</strong> test', 5 )
		).toBe( 13 );
	} );

	it( 'maps offset at the middle of a formatted word', () => {
		// Rich-text offset 7 = 'r' in "words" → HTML index 15
		expect(
			richTextOffsetToHtmlIndex( 'some <strong>words</strong> test', 7 )
		).toBe( 15 );
	} );

	it( 'maps offset right after a formatted word', () => {
		// Rich-text offset 10 = ' ' after "words" → HTML index 27 (after </strong>)
		expect(
			richTextOffsetToHtmlIndex( 'some <strong>words</strong> test', 10 )
		).toBe( 27 );
	} );

	it( 'maps offset before any tags', () => {
		// Rich-text offset 3 = 'e' in "some"
		expect(
			richTextOffsetToHtmlIndex( 'some <strong>words</strong> test', 3 )
		).toBe( 3 );
	} );

	it( 'maps offset at end of string', () => {
		const html = 'some <strong>words</strong> test';
		// Rich-text offset 15 = end of "some words test"
		expect( richTextOffsetToHtmlIndex( html, 15 ) ).toBe( html.length );
	} );

	it( 'handles nested formatting', () => {
		// "a<strong><em>b</em></strong>c"
		// Rich-text offset 1 = 'b' → HTML index 13
		expect(
			richTextOffsetToHtmlIndex( 'a<strong><em>b</em></strong>c', 1 )
		).toBe( 13 );
	} );

	it( 'handles tags with attributes', () => {
		// '<a href="https://example.com">link</a> text'
		// Rich-text offset 0 = 'l' → HTML index 30
		expect(
			richTextOffsetToHtmlIndex(
				'<a href="https://example.com">link</a> text',
				0
			)
		).toBe( 30 );
	} );

	it( 'is the inverse of htmlIndexToRichTextOffset for text positions', () => {
		const html = 'some <strong>words</strong> test';
		const textPositions = [ 0, 3, 5, 7, 10, 15 ];

		for ( const textOffset of textPositions ) {
			const htmlIndex = richTextOffsetToHtmlIndex( html, textOffset );
			const roundTripped = htmlIndexToRichTextOffset( html, htmlIndex );
			expect( roundTripped ).toBe( textOffset );
		}
	} );

	it( 'handles empty string', () => {
		expect( richTextOffsetToHtmlIndex( '', 0 ) ).toBe( 0 );
	} );

	it( 'handles HTML entity &amp;', () => {
		// "Tom &amp; Jerry"
		// Text: "Tom & Jerry" (11 chars)
		// Rich-text offset 4 = '&' → HTML index 4 (start of &amp;)
		expect( richTextOffsetToHtmlIndex( 'Tom &amp; Jerry', 4 ) ).toBe( 4 );
		// Rich-text offset 5 = ' ' after '&' → HTML index 9 (after &amp;)
		expect( richTextOffsetToHtmlIndex( 'Tom &amp; Jerry', 5 ) ).toBe( 9 );
	} );

	it( 'handles HTML entity &lt;', () => {
		// "a &lt; b"
		// Text: "a < b" (5 chars)
		// Rich-text offset 2 = '<' → HTML index 2 (start of &lt;)
		expect( richTextOffsetToHtmlIndex( 'a &lt; b', 2 ) ).toBe( 2 );
		// Rich-text offset 3 = ' ' after '<' → HTML index 6 (after &lt;)
		expect( richTextOffsetToHtmlIndex( 'a &lt; b', 3 ) ).toBe( 6 );
	} );

	it( 'handles numeric character references', () => {
		// "a&#38;b" (&#38; = &)
		// Text: "a&b" (3 chars)
		// Rich-text offset 1 = '&' → HTML index 1 (start of &#38;)
		expect( richTextOffsetToHtmlIndex( 'a&#38;b', 1 ) ).toBe( 1 );
		// Rich-text offset 2 = 'b' → HTML index 6 (after &#38;)
		expect( richTextOffsetToHtmlIndex( 'a&#38;b', 2 ) ).toBe( 6 );
	} );

	it( 'handles multiple formatted ranges', () => {
		// "a<strong>b</strong>c<em>d</em>e"
		// Text: "abcde"
		// Offset 1 = 'b' → HTML index 9 (after <strong>)
		expect(
			richTextOffsetToHtmlIndex( 'a<strong>b</strong>c<em>d</em>e', 1 )
		).toBe( 9 );
		// Offset 3 = 'd' → HTML index 24 (after <em>)
		expect(
			richTextOffsetToHtmlIndex( 'a<strong>b</strong>c<em>d</em>e', 3 )
		).toBe( 24 );
	} );
} );

describe( 'round-trip consistency', () => {
	const testCases: [ string, string ][] = [
		[ 'plain text', 'hello world' ],
		[ 'single bold', 'some <strong>words</strong> test' ],
		[ 'nested formatting', 'a<strong><em>bc</em>d</strong>e' ],
		[
			'link with attributes',
			'<a href="https://example.com">link</a> text',
		],
		[ 'multiple ranges', 'a<strong>b</strong>c<em>d</em>e' ],
		[ 'adjacent tags', '<em>a</em><strong>b</strong>' ],
		[ 'entity &amp;', 'Tom &amp; Jerry' ],
		[ 'entity &lt;', 'a &lt; b' ],
		[ 'numeric entity &#38;', 'a&#38;b' ],
	];

	for ( const [ label, html ] of testCases ) {
		it( `round-trips all text positions for: ${ label }`, () => {
			// Determine total text length by finding max valid offset.
			// Walk the HTML and count text chars for total length.
			const totalTextLen = htmlIndexToRichTextOffset( html, html.length );

			for (
				let textOffset = 0;
				textOffset <= totalTextLen;
				textOffset++
			) {
				const htmlIndex = richTextOffsetToHtmlIndex( html, textOffset );
				const roundTripped = htmlIndexToRichTextOffset(
					html,
					htmlIndex
				);
				expect( {
					label,
					textOffset,
					htmlIndex,
					roundTripped,
				} ).toMatchObject( {
					label,
					textOffset,
					roundTripped: textOffset,
				} );
			}
		} );
	}
} );
