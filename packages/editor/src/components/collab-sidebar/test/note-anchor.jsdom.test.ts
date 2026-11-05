import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
	RichTextData,
	registerFormatType,
	unregisterFormatType,
	store as richTextStore,
} from '@wordpress/rich-text';
import { select } from '@wordpress/data';
import {
	BLOCK_LEVEL_NOTE_START,
	findNoteInBlock,
	getInlineMarkerStart,
	getNoteRanges,
} from '../utils/note-anchor';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

describe( 'findNoteInBlock', () => {
	const FORMAT_NAME = 'core/note';

	const isRegistered = () =>
		!! select( richTextStore ).getFormatType( FORMAT_NAME );

	beforeAll( () => {
		if ( ! isRegistered() ) {
			registerFormatType( FORMAT_NAME, {
				title: 'Note',
				tagName: 'span',
				className: 'wp-note',
				attributes: { 'data-id': 'data-id' },
				edit: () => null,
			} );
		}
	} );

	afterAll( () => {
		if ( isRegistered() ) {
			unregisterFormatType( FORMAT_NAME );
		}
	} );

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
				'hello <span class="wp-note" data-id="7">marked</span> world'
			),
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
				'<span class="wp-note" data-id="9">cap</span>'
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
				'<span class="wp-note" data-id="3">x</span>'
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
				'<span class="wp-note" data-id="7">x</span>'
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
	// `findNoteInBlock` (which getInlineMarkerStart delegates to) walks rich-text
	// values and needs the `core/note` format registered to recognize the marker
	// elements the tests construct below.
	const FORMAT_NAME = 'core/note';

	const isRegistered = () =>
		!! select( richTextStore ).getFormatType( FORMAT_NAME );

	beforeAll( () => {
		if ( ! isRegistered() ) {
			registerFormatType( FORMAT_NAME, {
				title: 'Note',
				tagName: 'mark',
				className: 'wp-note',
				attributes: { 'data-id': 'data-id' },
				edit: () => null,
			} );
		}
	} );

	afterAll( () => {
		if ( isRegistered() ) {
			unregisterFormatType( FORMAT_NAME );
		}
	} );

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
