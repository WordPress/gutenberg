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

// `findNoteInBlock` (which getInlineMarkerStart and reconcileInlineNoteMarker
// delegate to) walks rich-text values and needs the `core/note` format
// registered to recognize the marker elements the tests construct below.
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

describe( 'reconcileInlineNoteMarker', () => {
	// Marker presence is resolved by the caller, so these cases drive the
	// decision directly via the `present` tristate (`true`/`false`/`null`).
	const inlineThread = { id: 7, blockClientId: 'abc' };

	it( 'returns "anchor" when the marker is present', () => {
		expect(
			reconcileInlineNoteMarker( inlineThread, true, new Set() )
		).toBe( 'anchor' );
	} );

	it( 'returns "delete" when a previously anchored marker is now gone', () => {
		expect(
			reconcileInlineNoteMarker( inlineThread, false, new Set( [ 7 ] ) )
		).toBe( 'delete' );
	} );

	it( 'returns "skip" when the marker is gone but was never observed (never-anchored note)', () => {
		expect(
			reconcileInlineNoteMarker( inlineThread, false, new Set() )
		).toBe( 'skip' );
	} );

	it( 'returns "skip" for a block-level note (no marker, never anchored)', () => {
		const blockLevel = { id: 5, blockClientId: 'abc' };
		expect(
			reconcileInlineNoteMarker( blockLevel, false, new Set() )
		).toBe( 'skip' );
	} );

	it( 'returns "skip" for an orphan thread with no blockClientId', () => {
		const orphan = { id: 7, blockClientId: null };
		expect(
			reconcileInlineNoteMarker( orphan, true, new Set( [ 7 ] ) )
		).toBe( 'skip' );
	} );

	it( 'returns "skip" when block attributes are not loaded yet', () => {
		expect(
			reconcileInlineNoteMarker( inlineThread, null, new Set( [ 7 ] ) )
		).toBe( 'skip' );
	} );
} );
