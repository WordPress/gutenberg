import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
	RichTextData,
	create,
	applyFormat,
	registerFormatType,
	unregisterFormatType,
	toHTMLString,
	store as richTextStore,
} from '@wordpress/rich-text';
import { select } from '@wordpress/data';
import {
	findNoteRange,
	applyNoteFormat,
	removeNoteFormat,
} from '../utils/note-format';
import { toRecord } from '../utils/rich-text';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

// Rich-text attributes parsed from post content keep their source HTML.
function parseRichTextAttribute( html: string ) {
	const element = document.createElement( 'p' );
	element.innerHTML = html;
	return RichTextData.fromHTMLElement( element );
}

describe( 'findNoteRange', () => {
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

	it( 'returns null when no marker is present', () => {
		const value = create( { html: 'hello world' } );
		expect( findNoteRange( value, 7 ) ).toBeNull();
	} );

	it( 'returns range for a marker matching the note id', () => {
		const value = create( {
			html: 'hello <span class="wp-note" data-id="7">marked</span> world',
		} );
		expect( findNoteRange( value, 7 ) ).toEqual( {
			start: 6,
			end: 12,
		} );
	} );

	it( 'returns the range in parsed content with collapsible whitespace', () => {
		const value = toRecord(
			parseRichTextAttribute(
				'one\n  two <span class="wp-note" data-id="7">three</span>'
			)
		);
		expect( findNoteRange( value, 7 ) ).toEqual( { start: 8, end: 13 } );
	} );

	it( 'returns null when the marker id does not match', () => {
		const value = create( {
			html: '<span class="wp-note" data-id="3">x</span>',
		} );
		expect( findNoteRange( value, 7 ) ).toBeNull();
	} );

	it( 'coerces ids to strings so numeric vs string ids match', () => {
		const value = create( {
			html: '<span class="wp-note" data-id="7">x</span>',
		} );
		expect( findNoteRange( value, '7' ) ).toEqual( { start: 0, end: 1 } );
	} );

	it( 'returns null when noteId itself is null/undefined', () => {
		const value = create( {
			html: '<span class="wp-note" data-id="7">x</span>',
		} );
		expect( findNoteRange( value, null ) ).toBeNull();
		expect( findNoteRange( value, undefined ) ).toBeNull();
	} );
} );

describe( 'applyNoteFormat', () => {
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
		if ( ! select( richTextStore ).getFormatType( 'core/bold' ) ) {
			registerFormatType( 'core/bold', {
				title: 'Bold',
				tagName: 'strong',
				className: null,
				edit: () => null,
			} );
		}
	} );

	afterAll( () => {
		if ( isRegistered() ) {
			unregisterFormatType( FORMAT_NAME );
		}
		if ( select( richTextStore ).getFormatType( 'core/bold' ) ) {
			unregisterFormatType( 'core/bold' );
		}
	} );

	const note = ( id: number ) => ( {
		type: FORMAT_NAME,
		attributes: { 'data-id': String( id ) },
	} );

	const applyAll = (
		html: string,
		ops: Array< [ number, number, number ] >
	) => {
		let record = create( { html } );
		for ( const [ id, start, end ] of ops ) {
			record = applyNoteFormat( record, note( id ), start, end );
		}
		return record;
	};

	it( 'adds a single marker over plain text', () => {
		const value = applyAll( 'the quick brown fox', [ [ 7, 4, 9 ] ] );
		expect( toHTMLString( { value } ) ).toBe(
			'the <mark data-id="7" class="wp-note">quick</mark> brown fox'
		);
	} );

	it( 'nests a contained note inside its parent (outer applied first)', () => {
		const value = applyAll( 'the quick brown fox jumps over', [
			[ 2, 0, 29 ],
			[ 1, 16, 22 ],
		] );
		expect( toHTMLString( { value } ) ).toBe(
			'<mark data-id="2" class="wp-note">the quick brown <mark data-id="1" class="wp-note">fox ju</mark>mps ove</mark>r'
		);
	} );

	it( 'nests the same regardless of application order (inner applied first)', () => {
		const value = applyAll( 'the quick brown fox jumps over', [
			[ 1, 16, 22 ],
			[ 2, 0, 29 ],
		] );
		expect( toHTMLString( { value } ) ).toBe(
			'<mark data-id="2" class="wp-note">the quick brown <mark data-id="1" class="wp-note">fox ju</mark>mps ove</mark>r'
		);
	} );

	it( 'keeps both notes when a larger note covers an existing one (no clobber)', () => {
		const value = applyAll( 'the quick brown fox jumps over', [
			[ 1, 16, 22 ],
			[ 2, 0, 29 ],
		] );
		expect( findNoteRange( value, 1 ) ).toEqual( { start: 16, end: 22 } );
		expect( findNoteRange( value, 2 ) ).toEqual( { start: 0, end: 29 } );
	} );

	it( 'preserves both full ranges across a partial (crossing) overlap', () => {
		const value = applyAll( 'the quick brown fox jumps over', [
			[ 1, 0, 18 ],
			[ 2, 10, 30 ],
		] );
		expect( findNoteRange( value, 1 ) ).toEqual( { start: 0, end: 18 } );
		expect( findNoteRange( value, 2 ) ).toEqual( { start: 10, end: 30 } );
	} );

	it( 'keeps disjoint notes separate', () => {
		const value = applyAll( 'the quick brown fox jumps over', [
			[ 1, 0, 9 ],
			[ 2, 16, 25 ],
		] );
		expect( toHTMLString( { value } ) ).toBe(
			'<mark data-id="1" class="wp-note">the quick</mark> brown <mark data-id="2" class="wp-note">fox jumps</mark> over'
		);
	} );

	it( 'preserves the note range when wrapping already-formatted text', () => {
		let record = create( { html: 'the quick brown fox jumps over' } );
		record = applyFormat( record, { type: 'core/bold' }, 4, 9 );
		record = applyNoteFormat( record, note( 1 ), 0, 18 );
		const value = create( { html: toHTMLString( { value: record } ) } );
		expect( findNoteRange( value, 1 ) ).toEqual( { start: 0, end: 18 } );
	} );
} );

describe( 'removeNoteFormat', () => {
	// `create`/`findNoteRange` parse marker elements through the registered
	// `core/note` format, so register it for the fixtures below.
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

	it( 'returns the same value when no marker matches the note id', () => {
		const value = create( {
			html: 'the <mark class="wp-note" data-id="2">quick</mark> brown fox',
		} );
		expect( removeNoteFormat( value, 1 ) ).toBe( value );
	} );

	it( 'removes the marker while leaving the text intact', () => {
		const value = create( {
			html: 'the <mark class="wp-note" data-id="7">quick</mark> brown fox',
		} );
		expect( toHTMLString( { value: removeNoteFormat( value, 7 ) } ) ).toBe(
			'the quick brown fox'
		);
	} );

	it( 'leaves unformatted text without format entries', () => {
		const value = create( {
			html: 'the <mark class="wp-note" data-id="7">quick</mark> brown fox',
		} );
		expect( Object.keys( removeNoteFormat( value, 7 ).formats ) ).toEqual(
			[]
		);
	} );

	it( 'leaves the text intact in parsed content with collapsible whitespace', () => {
		const value = toRecord(
			parseRichTextAttribute(
				'one\n  two <mark class="wp-note" data-id="7">three</mark>'
			)
		);
		expect( toHTMLString( { value: removeNoteFormat( value, 7 ) } ) ).toBe(
			'one two three'
		);
	} );

	it( 'removes only the targeted note, leaving a co-located note intact', () => {
		// Note 2 wraps the whole string; note 1 nests inside it.
		const value = create( {
			html: '<mark data-id="2" class="wp-note">the quick brown <mark data-id="1" class="wp-note">fox ju</mark>mps ove</mark>r',
		} );
		const result = removeNoteFormat( value, 1 );
		expect( findNoteRange( result, 1 ) ).toBeNull();
		expect( findNoteRange( result, 2 ) ).toEqual( { start: 0, end: 29 } );
	} );

	it( 'matches numeric and string note ids', () => {
		const html = 'a <mark class="wp-note" data-id="5">b</mark> c';
		expect(
			toHTMLString( {
				value: removeNoteFormat( create( { html } ), 5 ),
			} )
		).toBe( 'a b c' );
		expect(
			toHTMLString( {
				value: removeNoteFormat( create( { html } ), '5' ),
			} )
		).toBe( 'a b c' );
	} );
} );
