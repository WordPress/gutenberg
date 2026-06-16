/**
 * WordPress dependencies
 */
import {
	RichTextData,
	registerFormatType,
	unregisterFormatType,
	store as richTextStore,
} from '@wordpress/rich-text';
import { select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	BLOCK_LEVEL_NOTE_START,
	getInlineMarkerStart,
	reconcileInlineNoteMarker,
} from '../hooks';

// `findNoteRange`, which getInlineMarkerStart delegates to, walks rich-text
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

describe( 'getInlineMarkerStart', () => {
	it( 'returns the block-level sentinel when the thread has no inline selection meta', () => {
		const thread = { id: 1, meta: {} };
		expect( getInlineMarkerStart( thread, { content: 'hi' } ) ).toBe(
			BLOCK_LEVEL_NOTE_START
		);
	} );

	it( 'returns the block-level sentinel when meta is an empty array (WordPress empty-object serialization)', () => {
		const thread = { id: 1, meta: { _wp_note_selection: [] } };
		expect( getInlineMarkerStart( thread, { content: 'hi' } ) ).toBe(
			BLOCK_LEVEL_NOTE_START
		);
	} );

	it( 'returns the marker start offset when the block carries a matching marker', () => {
		const attributes = {
			content: RichTextData.fromHTMLString(
				'hello <mark class="wp-note" data-id="7">marked</mark> world'
			),
		};
		const thread = {
			id: 7,
			meta: { _wp_note_selection: { attributeKey: 'content' } },
		};
		expect( getInlineMarkerStart( thread, attributes ) ).toBe( 6 );
	} );

	it( 'falls back to the stored offset when the marker has been stripped from content', () => {
		const attributes = {
			content: RichTextData.fromHTMLString( 'hello world' ),
		};
		const thread = {
			id: 7,
			meta: {
				_wp_note_selection: {
					attributeKey: 'content',
					start: 4,
					end: 8,
				},
			},
		};
		expect( getInlineMarkerStart( thread, attributes ) ).toBe( 4 );
	} );

	it( 'falls back to the block-level sentinel when neither marker nor stored offset is available', () => {
		const attributes = {
			content: RichTextData.fromHTMLString( 'hello world' ),
		};
		const thread = {
			id: 7,
			meta: { _wp_note_selection: { attributeKey: 'content' } },
		};
		// No marker for id 7 in content and no stored offset → block-level.
		expect( getInlineMarkerStart( thread, attributes ) ).toBe(
			BLOCK_LEVEL_NOTE_START
		);
	} );

	it( 'returns the block-level sentinel when the named attribute is missing on the block', () => {
		const thread = {
			id: 7,
			meta: {
				_wp_note_selection: {
					attributeKey: 'content',
					start: 2,
					end: 5,
				},
			},
		};
		// Empty attributes object — attributeKey resolves to undefined.
		// The stored offset is a fallback, so we still get a real number.
		expect( getInlineMarkerStart( thread, {} ) ).toBe( 2 );
	} );

	it( 'returns the block-level sentinel when block attributes themselves are null', () => {
		const thread = {
			id: 7,
			meta: {
				_wp_note_selection: { attributeKey: 'content' },
			},
		};
		expect( getInlineMarkerStart( thread, null ) ).toBe(
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
			// Block-level note — should sort first.
			{ id: 99, meta: {} },
			// Inline notes — should sort by marker offset, then id.
			{
				id: 1,
				meta: { _wp_note_selection: { attributeKey: 'content' } },
			},
			{
				id: 2,
				meta: { _wp_note_selection: { attributeKey: 'content' } },
			},
			{
				id: 3,
				meta: { _wp_note_selection: { attributeKey: 'content' } },
			},
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

describe( 'reconcileInlineNoteMarker', () => {
	const inlineThread = {
		id: 7,
		blockClientId: 'abc',
		meta: { _wp_note_selection: { attributeKey: 'content' } },
	};
	const withMarker = {
		content: RichTextData.fromHTMLString(
			'hello <mark class="wp-note" data-id="7">marked</mark> world'
		),
	};
	const withoutMarker = {
		content: RichTextData.fromHTMLString( 'hello world' ),
	};

	it( 'returns "anchor" when the marker is present', () => {
		expect(
			reconcileInlineNoteMarker( inlineThread, withMarker, new Set() )
		).toBe( 'anchor' );
	} );

	it( 'returns "delete" when a previously anchored marker is now gone', () => {
		expect(
			reconcileInlineNoteMarker(
				inlineThread,
				withoutMarker,
				new Set( [ 7 ] )
			)
		).toBe( 'delete' );
	} );

	it( 'returns "skip" when the marker is gone but was never observed (legacy/never-anchored note)', () => {
		expect(
			reconcileInlineNoteMarker( inlineThread, withoutMarker, new Set() )
		).toBe( 'skip' );
	} );

	it( 'returns "skip" for a block-level note (no inline selection meta)', () => {
		const blockLevel = { id: 7, blockClientId: 'abc', meta: {} };
		expect(
			reconcileInlineNoteMarker(
				blockLevel,
				withMarker,
				new Set( [ 7 ] )
			)
		).toBe( 'skip' );
	} );

	it( 'returns "skip" when meta is an empty array (WordPress empty-object serialization)', () => {
		const thread = {
			id: 7,
			blockClientId: 'abc',
			meta: { _wp_note_selection: [] },
		};
		expect(
			reconcileInlineNoteMarker( thread, withoutMarker, new Set( [ 7 ] ) )
		).toBe( 'skip' );
	} );

	it( 'returns "skip" for an orphan thread with no blockClientId', () => {
		const orphan = {
			id: 7,
			blockClientId: null,
			meta: { _wp_note_selection: { attributeKey: 'content' } },
		};
		expect(
			reconcileInlineNoteMarker( orphan, withMarker, new Set( [ 7 ] ) )
		).toBe( 'skip' );
	} );

	it( 'returns "skip" when block attributes are not loaded yet', () => {
		expect(
			reconcileInlineNoteMarker( inlineThread, null, new Set( [ 7 ] ) )
		).toBe( 'skip' );
	} );
} );
