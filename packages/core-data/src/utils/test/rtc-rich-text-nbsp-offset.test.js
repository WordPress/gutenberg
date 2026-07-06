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
	asHtmlStringIndex,
	asRichTextOffset,
} from '../crdt-utils';

/**
 * Regression coverage for #79711: pasting formatted text that contains HTML
 * entities (notably `&nbsp;`, which external sources such as Word / Google
 * Docs / lipsum.com produce) shifted a remote collaborator's cursor 4–5
 * characters behind its real position.
 *
 * The Y.Text stores the raw serialized HTML (with `&nbsp;` as six characters).
 * `richTextOffsetToHtmlIndex` must map a rich-text offset to an index into
 * that raw string. The previous implementation round-tripped through
 * `toHTMLString( create() )`, which re-encodes `&nbsp;` back to a plain space,
 * yielding an index into a shorter string and drifting the cursor.
 */
describe( 'richTextOffsetToHtmlIndex with HTML entities', () => {
	const cases = [
		'<strong>Lorem Ipsum</strong>&nbsp;is simply dummy text',
		'plain&nbsp;text&nbsp;with&nbsp;nbsp',
		'&nbsp;&nbsp;&nbsp;leading nbsp',
		'<strong>bold</strong>&nbsp;<em>italic</em>&nbsp;end',
		'a&amp;b&nbsp;c',
		'line<br>break&nbsp;after',
		// Inline image (a rich-text "object" counted as one visible character)
		// combined with an entity, to guard the void-element handling.
		'a<img src="x.png" alt="y">b&nbsp;c',
	];

	it.each( cases )(
		'round-trips every rich-text offset for: %s',
		( html ) => {
			const visibleLength = htmlIndexToRichTextOffset(
				html,
				asHtmlStringIndex( html.length )
			);

			for ( let offset = 0; offset <= visibleLength; offset++ ) {
				const htmlIndex = richTextOffsetToHtmlIndex(
					html,
					asRichTextOffset( offset )
				);
				const back = htmlIndexToRichTextOffset(
					html,
					asHtmlStringIndex( htmlIndex )
				);
				expect( { offset, back } ).toEqual( {
					offset,
					back: offset,
				} );
			}
		}
	);

	it( 'maps an offset after an &nbsp; to the correct raw HTML index', () => {
		// "Lorem Ipsum is simply dummy text" — offset 20 is inside the text
		// after the `&nbsp;` that follows the bold "Lorem Ipsum".
		const html = '<strong>Lorem Ipsum</strong>&nbsp;is simply dummy text';
		const htmlIndex = richTextOffsetToHtmlIndex(
			html,
			asRichTextOffset( 20 )
		);
		// The bold tags (8 + 9) plus the 6-character `&nbsp;` (for 1 visible
		// char) must all be accounted for: previously this drifted ~5 short.
		expect(
			htmlIndexToRichTextOffset( html, asHtmlStringIndex( htmlIndex ) )
		).toBe( 20 );
	} );
} );
