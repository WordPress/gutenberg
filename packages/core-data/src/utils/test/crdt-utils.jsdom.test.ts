import { describe, expect, it } from 'vitest';
import { Delta, Y } from '@wordpress/sync';
import {
	asHtmlStringIndex,
	asRichTextOffset,
	getYTextByAttributeKey,
	htmlIndexToRichTextOffset as typedHtmlIndexToRichTextOffset,
	richTextOffsetToHtmlIndex as typedRichTextOffsetToHtmlIndex,
	splitHtmlTag,
	tokenizeHtml,
} from '../crdt-utils';

function htmlIndexToRichTextOffset( html: string, htmlIndex: number ) {
	return typedHtmlIndexToRichTextOffset(
		html,
		asHtmlStringIndex( htmlIndex )
	);
}

function richTextOffsetToHtmlIndex( html: string, richTextOffset: number ) {
	return typedRichTextOffsetToHtmlIndex(
		html,
		asRichTextOffset( richTextOffset )
	);
}

function createAttachedAttributes(): Y.Map< unknown > {
	const ydoc = new Y.Doc();
	const root = ydoc.getMap( 'test' );
	const attributes = new Y.Map< unknown >();
	root.set( 'attributes', attributes );
	return attributes;
}

describe( 'getYTextByAttributeKey', () => {
	it( 'returns a top-level rich-text attribute', () => {
		const attributes = createAttachedAttributes();
		const text = new Y.Text( 'Top level' );
		attributes.set( 'content', text );

		expect( getYTextByAttributeKey( attributes, 'content' ) ).toBe( text );
	} );

	it( 'returns a nested rich-text attribute by dot path', () => {
		const attributes = createAttachedAttributes();
		const body = new Y.Array< Y.Map< unknown > >();
		const row = new Y.Map< unknown >();
		const cells = new Y.Array< Y.Map< unknown > >();
		const cell = new Y.Map< unknown >();
		const text = new Y.Text( 'Cell text' );

		cell.set( 'content', text );
		cells.push( [ cell ] );
		row.set( 'cells', cells );
		body.push( [ row ] );
		attributes.set( 'body', body );

		expect(
			getYTextByAttributeKey( attributes, 'body.0.cells.0.content' )
		).toBe( text );
	} );

	it( 'returns null for invalid array path segments', () => {
		const attributes = createAttachedAttributes();
		const body = new Y.Array< Y.Map< unknown > >();
		attributes.set( 'body', body );

		expect(
			getYTextByAttributeKey( attributes, 'body.01.cells.0.content' )
		).toBeNull();
		expect(
			getYTextByAttributeKey( attributes, 'body.-1.cells.0.content' )
		).toBeNull();
	} );
} );

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

describe( 'tokenizeHtml', () => {
	it( 'tokenizes plain text into individual code points', () => {
		expect( tokenizeHtml( 'abc' ) ).toEqual( [ 'a', 'b', 'c' ] );
	} );

	it( 'does not split surrogate pairs when tokenizing emojis', () => {
		expect( tokenizeHtml( 'a 😀 b' ) ).toEqual( [
			'a',
			' ',
			'😀',
			' ',
			'b',
		] );
		expect( tokenizeHtml( '🇺🇸' ) ).toEqual( [ '🇺', '🇸' ] );
		expect( tokenizeHtml( '👋🏽' ) ).toEqual( [ '👋', '🏽' ] );
	} );

	it( 'handles supplementary plane characters', () => {
		// CJK Unified Ideographs Extension B (U+20BB7)
		expect( tokenizeHtml( '𠮷' ) ).toEqual( [ '𠮷' ] );
		// Mathematical alphanumeric symbols (U+1D400)
		expect( tokenizeHtml( '𝐀' ) ).toEqual( [ '𝐀' ] );
	} );

	it( 'treats HTML tags as single tokens', () => {
		expect( tokenizeHtml( '<strong>bold</strong>' ) ).toEqual( [
			'<strong>',
			'b',
			'o',
			'l',
			'd',
			'</strong>',
		] );
	} );

	it( 'treats tags with attributes (including quotes and spaces) as single tokens', () => {
		expect(
			tokenizeHtml( '<a href="https://example.com?foo=1&bar=2">link</a>' )
		).toEqual( [
			'<a href="https://example.com?foo=1&bar=2">',
			'l',
			'i',
			'n',
			'k',
			'</a>',
		] );
	} );

	it( 'treats self-closing tags as single tokens', () => {
		expect(
			tokenizeHtml( '<img src="image.jpg" alt="test > arrow" />' )
		).toEqual( [ '<img src="image.jpg" alt="test > arrow" />' ] );
		expect( tokenizeHtml( '<br />' ) ).toEqual( [ '<br />' ] );
		expect( tokenizeHtml( '<hr/>' ) ).toEqual( [ '<hr/>' ] );
	} );

	it( 'treats custom element tags and namespaced tags as single tokens', () => {
		expect(
			tokenizeHtml( '<my-custom-tag value="123"></my-custom-tag>' )
		).toEqual( [ '<my-custom-tag value="123">', '</my-custom-tag>' ] );
		expect( tokenizeHtml( '<svg:path d="M0 0h24v24H0z" />' ) ).toEqual( [
			'<svg:path d="M0 0h24v24H0z" />',
		] );
	} );

	it( 'treats HTML comments as single tokens', () => {
		expect(
			tokenizeHtml( '<!-- wp:paragraph {"fontSize":"small"} -->' )
		).toEqual( [ '<!-- wp:paragraph {"fontSize":"small"} -->' ] );
		expect(
			tokenizeHtml( '<!-- comment with <div> and > inside -->' )
		).toEqual( [ '<!-- comment with <div> and > inside -->' ] );
	} );

	it( 'treats HTML character entities as single tokens', () => {
		expect(
			tokenizeHtml( '&amp;&lt;&gt;&quot;&nbsp;&#123;&#x1F600;' )
		).toEqual( [
			'&amp;',
			'&lt;',
			'&gt;',
			'&quot;',
			'&nbsp;',
			'&#123;',
			'&#x1F600;',
		] );
	} );

	it( 'does not treat raw angle brackets in math comparisons as tags', () => {
		expect( tokenizeHtml( '3 < 5 and 7 > 2' ) ).toEqual( [
			'3',
			' ',
			'<',
			' ',
			'5',
			' ',
			'a',
			'n',
			'd',
			' ',
			'7',
			' ',
			'>',
			' ',
			'2',
		] );
	} );

	it( 'handles empty string and malformed/unclosed tags gracefully', () => {
		expect( tokenizeHtml( '' ) ).toEqual( [] );
		expect( tokenizeHtml( '<strong unclosed' ) ).toEqual( [
			'<',
			's',
			't',
			'r',
			'o',
			'n',
			'g',
			' ',
			'u',
			'n',
			'c',
			'l',
			'o',
			's',
			'e',
			'd',
		] );
	} );
} );

describe( 'splitHtmlTag', () => {
	it( 'splits opening tags into tag name, attributes, and closing bracket', () => {
		expect( splitHtmlTag( '<a href="x" target="_blank">' ) ).toEqual( [
			'<a',
			' href="x"',
			' target="_blank"',
			'>',
		] );
	} );

	it( 'returns non-opening tags whole', () => {
		expect( splitHtmlTag( '</a>' ) ).toEqual( [ '</a>' ] );
		expect( splitHtmlTag( '<!-- comment -->' ) ).toEqual( [
			'<!-- comment -->',
		] );
		expect( splitHtmlTag( '&amp;' ) ).toEqual( [ '&amp;' ] );
		expect( splitHtmlTag( 'text' ) ).toEqual( [ 'text' ] );
	} );
} );

describe( 'tokenized diffing via DiffOptions', () => {
	it( 'should keep HTML tags as indivisible units during diff', () => {
		const oldDelta = new Delta().insert( 'the quick brown fox' );
		const newDelta = new Delta().insert(
			'the <strong data-attr="test">quick</strong> brown fox'
		);

		const diff = oldDelta.diff( newDelta, {
			tokenizer: tokenizeHtml,
			splitToken: splitHtmlTag,
		} );
		expect( diff.ops ).toEqual( [
			{ retain: 4 },
			{ insert: '<strong data-attr="test">' },
			{ retain: 5 },
			{ insert: '</strong>' },
		] );
	} );

	it( 'should not interleave characters inside HTML tags when formatting overlapping text', () => {
		const oldDelta = new Delta().insert( 'the quick brown fox' );
		const linkDelta = new Delta().insert(
			'the qu<a href="https://example.com">ick brown</a> fox'
		);

		const diff = oldDelta.diff( linkDelta, {
			tokenizer: tokenizeHtml,
			splitToken: splitHtmlTag,
		} );
		expect( diff.ops ).toEqual( [
			{ retain: 6 },
			{ insert: '<a href="https://example.com">' },
			{ retain: 9 },
			{ insert: '</a>' },
		] );
	} );

	it( 'refines tag replacement when modifying attributes of the same tag', () => {
		const oldDelta = new Delta().insert(
			'see <a href="https://old.example/">the docs</a> now'
		);
		const newDelta = new Delta().insert(
			'see <a href="https://new.example/">the docs</a> now'
		);

		const diff = oldDelta.diff( newDelta, {
			tokenizer: tokenizeHtml,
			splitToken: splitHtmlTag,
		} );

		// Should retain 'see <a', replace href, and retain '>'
		expect( diff.ops ).toEqual( [
			{ retain: 6 }, // 'see <a'
			{ insert: ' href="https://new.example/"' },
			{ delete: 28 }, // ' href="https://old.example/"'
		] );
	} );

	it( 'replaces the tag completely when tag names differ', () => {
		const oldDelta = new Delta().insert( 'the <strong>quick</strong> fox' );
		const newDelta = new Delta().insert( 'the <em>quick</em> fox' );

		const diff = oldDelta.diff( newDelta, {
			tokenizer: tokenizeHtml,
			splitToken: splitHtmlTag,
		} );

		expect( diff.ops ).toEqual( [
			{ retain: 4 },
			{ insert: '<em>' },
			{ delete: 8 }, // '<strong>'
			{ retain: 5 },
			{ insert: '</em>' },
			{ delete: 9 }, // '</strong>'
		] );
	} );

	it( 'should replace emoji atomically without splitting surrogate pairs', () => {
		const oldDelta = new Delta().insert( 'a 😀 b' );
		const newDelta = new Delta().insert( 'a 😐 b' );

		const diff = oldDelta.diff( newDelta, {
			tokenizer: tokenizeHtml,
			splitToken: splitHtmlTag,
		} );
		expect( diff.ops ).toEqual( [
			{ retain: 2 },
			{ insert: '😐' },
			{ delete: 2 },
		] );
	} );
} );
