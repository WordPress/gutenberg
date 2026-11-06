import { beforeAll, describe, expect, it } from 'vitest';
import { RichTextData, registerFormatType } from '@wordpress/rich-text';
import {
	BLOCK_LEVEL_NOTE_START,
	findNoteInBlock,
	getInlineMarkerStart,
	getNoteRanges,
	removeInlineNote,
	wrapInlineNote,
} from '../utils/note-anchor';
import { noteFormat } from '../format';
import { NOTE_FORMAT_NAME } from '../constants';

beforeAll( () => {
	registerFormatType( NOTE_FORMAT_NAME, noteFormat );
} );

// Rich-text attributes parsed from post content keep their source HTML.
function parseRichTextAttribute( html: string ) {
	const element = document.createElement( 'p' );
	element.innerHTML = html;
	return RichTextData.fromHTMLElement( element );
}

describe( 'findNoteInBlock', () => {
	it( 'returns null when attributes are null/undefined', () => {
		expect( findNoteInBlock( null, 7 ) ).toBeNull();
		expect( findNoteInBlock( undefined, 7 ) ).toBeNull();
	} );

	it( 'returns null when no attribute carries a matching marker', () => {
		const attributes = {
			content: RichTextData.fromHTMLString( 'hello world' ),
			align: 'left',
		};
		expect( findNoteInBlock( attributes, 7 ) ).toBeNull();
	} );

	it( 'returns the attribute key and range of the matching marker', () => {
		const attributes = {
			content: RichTextData.fromHTMLString(
				'hello <mark class="wp-note" data-id="7">marked</mark> world'
			),
		};
		expect( findNoteInBlock( attributes, 7 ) ).toEqual( {
			attributeKey: 'content',
			start: 6,
			end: 12,
		} );
	} );

	it( 'finds the marker in a string attribute', () => {
		const attributes = {
			content:
				'hello <mark class="wp-note" data-id="7">marked</mark> world',
		};
		expect( findNoteInBlock( attributes, 7 ) ).toEqual( {
			attributeKey: 'content',
			start: 6,
			end: 12,
		} );
	} );

	it( 'discovers the marker in a non-primary rich-text attribute', () => {
		const attributes = {
			content: RichTextData.fromHTMLString( 'no marker here' ),
			caption: RichTextData.fromHTMLString(
				'<mark class="wp-note" data-id="9">cap</mark>'
			),
		};
		expect( findNoteInBlock( attributes, 9 ) ).toEqual( {
			attributeKey: 'caption',
			start: 0,
			end: 3,
		} );
	} );

	it( 'ignores non-rich-text attribute values without throwing', () => {
		const attributes = {
			level: 2,
			anchor: '',
			content: RichTextData.fromHTMLString(
				'<mark class="wp-note" data-id="3">x</mark>'
			),
		};
		expect( findNoteInBlock( attributes, 3 ) ).toEqual( {
			attributeKey: 'content',
			start: 0,
			end: 1,
		} );
	} );

	it( 'coerces ids to strings so numeric vs string ids match', () => {
		const attributes = {
			content: RichTextData.fromHTMLString(
				'<mark class="wp-note" data-id="7">x</mark>'
			),
		};
		expect( findNoteInBlock( attributes, '7' ) ).toEqual( {
			attributeKey: 'content',
			start: 0,
			end: 1,
		} );
	} );
} );

describe( 'getInlineMarkerStart', () => {
	it( 'returns the block-level sentinel when the block carries no marker for the note', () => {
		const attributes = {
			content: RichTextData.fromHTMLString( 'hello world' ),
		};
		const thread = { id: 1 };
		expect( getInlineMarkerStart( thread, attributes ) ).toBe(
			BLOCK_LEVEL_NOTE_START
		);
	} );

	it( 'returns the marker start offset when the block carries a matching marker', () => {
		const attributes = {
			content: RichTextData.fromHTMLString(
				'hello <mark class="wp-note" data-id="7">marked</mark> world'
			),
		};
		expect( getInlineMarkerStart( { id: 7 }, attributes ) ).toBe( 6 );
	} );

	it( 'discovers the marker in a non-primary rich-text attribute', () => {
		const attributes = {
			content: RichTextData.fromHTMLString( 'no marker here' ),
			caption: RichTextData.fromHTMLString(
				'xx <mark class="wp-note" data-id="7">y</mark>'
			),
		};
		expect( getInlineMarkerStart( { id: 7 }, attributes ) ).toBe( 3 );
	} );

	it( 'returns the block-level sentinel when block attributes are empty', () => {
		expect( getInlineMarkerStart( { id: 7 }, {} ) ).toBe(
			BLOCK_LEVEL_NOTE_START
		);
	} );

	it( 'returns the block-level sentinel when block attributes are null', () => {
		expect( getInlineMarkerStart( { id: 7 }, null ) ).toBe(
			BLOCK_LEVEL_NOTE_START
		);
	} );

	it( 'is order-stable when used as a sort key: block-level first, then by start offset, then by id', () => {
		const attributes = {
			content: RichTextData.fromHTMLString(
				'a <mark class="wp-note" data-id="2">x</mark> b <mark class="wp-note" data-id="3">y</mark> c <mark class="wp-note" data-id="1">z</mark>'
			),
		};
		const threads = [
			// Block-level note (no marker) — should sort first.
			{ id: 99 },
			// Inline notes — should sort by marker offset, then id.
			{ id: 1 },
			{ id: 2 },
			{ id: 3 },
		];
		const sorted = [ ...threads ].sort( ( a, b ) => {
			const aStart = getInlineMarkerStart( a, attributes );
			const bStart = getInlineMarkerStart( b, attributes );
			if ( aStart !== bStart ) {
				return aStart - bStart;
			}
			return a.id - b.id;
		} );
		expect( sorted.map( ( t ) => t.id ) ).toEqual( [ 99, 2, 3, 1 ] );
	} );
} );

describe( 'getNoteRanges', () => {
	const at = ( clientId: string, offset: number ) => ( {
		clientId,
		attributeKey: 'content',
		offset,
	} );
	const blocks = ( ...clientIds: string[] ) =>
		clientIds.map( ( clientId ) =>
			clientId === 'image'
				? { clientId, attributes: {} }
				: {
						clientId,
						attributes: {
							content: RichTextData.fromHTMLString( 'abcdef' ),
						},
						attributeKey: 'content',
					}
		);

	it( 'takes the selected text of one block', () => {
		expect(
			getNoteRanges( {
				blocks: blocks( 'a' ),
				selectionStart: at( 'a', 5 ),
				selectionEnd: at( 'a', 2 ),
			} )
		).toEqual(
			new Map( [
				[ 'a', { attributeKey: 'content', start: 2, end: 5 } ],
			] )
		);
	} );

	it( 'takes the first block from the caret, the middle in full and the last up to the caret', () => {
		expect(
			getNoteRanges( {
				blocks: blocks( 'a', 'b', 'c' ),
				selectionStart: at( 'c', 3 ),
				selectionEnd: at( 'a', 2 ),
			} )
		).toEqual(
			new Map( [
				[ 'a', { attributeKey: 'content', start: 2, end: 6 } ],
				[ 'b', { attributeKey: 'content', start: 0, end: 6 } ],
				[ 'c', { attributeKey: 'content', start: 0, end: 3 } ],
			] )
		);
	} );

	it( 'takes the text of a string attribute', () => {
		expect(
			getNoteRanges( {
				blocks: [
					{
						clientId: 'a',
						attributes: { content: 'abcdef' },
						attributeKey: 'content',
					},
					...blocks( 'b' ),
				],
				selectionStart: at( 'a', 2 ),
				selectionEnd: at( 'b', 3 ),
			} ).get( 'a' )
		).toEqual( { attributeKey: 'content', start: 2, end: 6 } );
	} );

	it( 'takes a block without a sole rich text field as a whole', () => {
		expect(
			getNoteRanges( {
				blocks: blocks( 'a', 'image', 'c' ),
				selectionStart: at( 'a', 2 ),
				selectionEnd: at( 'c', 3 ),
			} ).has( 'image' )
		).toBe( false );
	} );
} );

describe( 'inline note writers', () => {
	it( 'wraps the selected text in parsed content with collapsible whitespace', () => {
		const value = parseRichTextAttribute( 'one\n  two three' );
		expect( String( wrapInlineNote( value, 7, 8, 13 ) ) ).toBe(
			'one two <mark data-id="7" class="wp-note">three</mark>'
		);
	} );

	it( 'leaves a marker in a string attribute in place', () => {
		const attributes = {
			content: 'a <mark class="wp-note" data-id="7">b</mark> c',
		};
		expect( removeInlineNote( attributes, 7 ) ).toBeNull();
	} );
} );
