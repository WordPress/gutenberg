import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
	RichTextData,
	store as richTextStore,
	unregisterFormatType,
} from '@wordpress/rich-text';
import { select } from '@wordpress/data';
import {
	analyzeTextEdit,
	planEditMarkers,
	applyEditPlan,
	widenReplaceToWords,
} from '../reconcile-edit';
import {
	registerSuggestionFormat,
	findSuggestionText,
	findSuggestionRange,
	SUGGESTION_FORMAT_NAME,
} from '../format';

const getFormatType = ( name: string ) =>
	( select( richTextStore as any ) as any ).getFormatType( name );

const add = ( id: number | string, text: string, author?: number | string ) =>
	`<mark class="wp-suggestion" data-suggestion-id="${ id }" data-suggestion-type="add"${
		author !== undefined ? ` data-author="${ author }"` : ''
	}>${ text }</mark>`;

const del = ( id: number | string, text: string, author?: number | string ) =>
	`<mark class="wp-suggestion" data-suggestion-id="${ id }" data-suggestion-type="del"${
		author !== undefined ? ` data-author="${ author }"` : ''
	}>${ text }</mark>`;

const rtd = ( html: string ) => RichTextData.fromHTMLString( html );

describe( 'analyzeTextEdit', () => {
	it( 'reports no change for identical text', () => {
		expect( analyzeTextEdit( 'same', 'same' ) ).toEqual( {
			kind: 'none',
			start: 0,
			end: 0,
			insertedText: '',
			removedText: '',
		} );
	} );

	it( 'detects an append', () => {
		expect( analyzeTextEdit( 'Hello', 'Hello world' ) ).toEqual( {
			kind: 'insert',
			start: 5,
			end: 5,
			insertedText: ' world',
			removedText: '',
		} );
	} );

	it( 'detects an insert at the start', () => {
		expect( analyzeTextEdit( 'world', 'Hi world' ) ).toEqual( {
			kind: 'insert',
			start: 0,
			end: 0,
			insertedText: 'Hi ',
			removedText: '',
		} );
	} );

	it( 'detects a single-character insert in the middle', () => {
		expect( analyzeTextEdit( 'Helo', 'Hello' ) ).toMatchObject( {
			kind: 'insert',
			start: 3,
			end: 3,
			insertedText: 'l',
		} );
	} );

	it( 'detects a trailing delete', () => {
		expect( analyzeTextEdit( 'Hello world', 'Hello' ) ).toEqual( {
			kind: 'delete',
			start: 5,
			end: 11,
			insertedText: '',
			removedText: ' world',
		} );
	} );

	it( 'detects a single-character delete in the middle', () => {
		expect( analyzeTextEdit( 'Hello', 'Helo' ) ).toMatchObject( {
			kind: 'delete',
			start: 3,
			end: 4,
			removedText: 'l',
		} );
	} );

	it( 'detects a replace (type-over)', () => {
		expect( analyzeTextEdit( 'Hello world', 'Hello there' ) ).toEqual( {
			kind: 'replace',
			start: 6,
			end: 11,
			insertedText: 'there',
			removedText: 'world',
		} );
	} );

	it( 'treats a non-string as empty', () => {
		expect( analyzeTextEdit( undefined, 'hi' ) ).toMatchObject( {
			kind: 'insert',
			insertedText: 'hi',
		} );
	} );
} );

describe( 'planEditMarkers', () => {
	beforeAll( () => {
		registerSuggestionFormat();
	} );

	afterAll( () => {
		if ( getFormatType( SUGGESTION_FORMAT_NAME ) ) {
			unregisterFormatType( SUGGESTION_FORMAT_NAME );
		}
	} );

	it( 'returns nothing for a non-rich value', () => {
		expect( planEditMarkers( undefined, undefined ) ).toEqual( {
			kind: 'none',
			actions: [],
		} );
	} );

	it( 'returns nothing when the text is unchanged', () => {
		expect( planEditMarkers( rtd( 'Hello' ), rtd( 'Hello' ) ) ).toEqual( {
			kind: 'none',
			actions: [],
		} );
	} );

	it( 'plans a new add marker for an insert into plain text', () => {
		expect(
			planEditMarkers( rtd( 'Hello' ), rtd( 'Hello world' ) )
		).toEqual( {
			kind: 'insert',
			actions: [
				{
					type: 'insert-add',
					at: 5,
					text: ' world',
					newNote: true,
				},
			],
		} );
	} );

	it( 'grows the author own open addition when typing at its trailing edge', () => {
		const prev = rtd( add( 7, 'new', 2 ) );
		const next = rtd( add( 7, 'new', 2 ) + 's' );
		expect( planEditMarkers( prev, next, { authorId: 2 } ) ).toEqual( {
			kind: 'insert',
			actions: [ { type: 'grow-add', id: '7', text: 's', at: 3 } ],
		} );
	} );

	it( 'does not grow another author addition; starts a new add', () => {
		const prev = rtd( add( 7, 'new', 2 ) );
		const next = rtd( add( 7, 'new', 2 ) + 's' );
		expect( planEditMarkers( prev, next, { authorId: 9 } ) ).toEqual( {
			kind: 'insert',
			actions: [
				{ type: 'insert-add', at: 3, text: 's', newNote: true },
			],
		} );
	} );

	/*
	 * #73411 finding F-06. Typing inside the author's own pending addition used
	 * to plan nothing, so the edit fell through to the whole-content overlay (or,
	 * on the typing seam, nested a second marker inside the first). It extends
	 * the one marker now.
	 */
	it( 'grows the author own addition when typing inside it', () => {
		// Insert between the two characters of an existing add marker.
		const prev = rtd( add( 7, 'ab', 2 ) );
		const next = rtd( add( 7, 'aXb', 2 ) );
		expect( planEditMarkers( prev, next, { authorId: 2 } ) ).toEqual( {
			kind: 'insert',
			actions: [ { type: 'grow-add', id: '7', text: 'X', at: 1 } ],
		} );
	} );

	it( 'does not act when typing inside another author addition', () => {
		const prev = rtd( add( 7, 'ab', 2 ) );
		const next = rtd( add( 7, 'aXb', 2 ) );
		expect( planEditMarkers( prev, next, { authorId: 9 } ) ).toEqual( {
			kind: 'insert',
			actions: [],
		} );
	} );

	it( 'does not act when typing inside a pending deletion', () => {
		const prev = rtd( del( 7, 'ab', 2 ) );
		const next = rtd( del( 7, 'aXb', 2 ) );
		expect( planEditMarkers( prev, next, { authorId: 2 } ) ).toEqual( {
			kind: 'insert',
			actions: [],
		} );
	} );

	it( 'plans a del marker for a delete of unmarked text', () => {
		expect(
			planEditMarkers( rtd( 'Hello world' ), rtd( 'Hello' ) )
		).toEqual( {
			kind: 'delete',
			actions: [ { type: 'wrap-del', start: 5, end: 11, newNote: true } ],
		} );
	} );

	it( 'is a no-op when deleting text already marked for deletion', () => {
		const prev = rtd( del( 4, 'world' ) );
		const next = rtd( '' );
		expect( planEditMarkers( prev, next ) ).toEqual( {
			kind: 'delete',
			actions: [],
		} );
	} );

	it( 'removes the author own pending addition when they delete it', () => {
		const prev = rtd( add( 8, 'abc', 2 ) );
		const next = rtd( '' );
		expect( planEditMarkers( prev, next, { authorId: 2 } ) ).toEqual( {
			kind: 'delete',
			actions: [ { type: 'remove-add', id: '8' } ],
		} );
	} );

	it( 'does not remove another author pending addition', () => {
		const prev = rtd( add( 8, 'abc', 2 ) );
		const next = rtd( '' );
		expect( planEditMarkers( prev, next, { authorId: 9 } ) ).toEqual( {
			kind: 'delete',
			actions: [],
		} );
		// An authored marker is not the unknown editor's either.
		expect( planEditMarkers( prev, next ) ).toEqual( {
			kind: 'delete',
			actions: [],
		} );
	} );

	it( 'plans a del + add pair for a type-over of unmarked text', () => {
		expect(
			planEditMarkers( rtd( 'Hello world' ), rtd( 'Hello there' ) )
		).toEqual( {
			kind: 'replace',
			actions: [
				{ type: 'wrap-del', start: 6, end: 11, newNote: true },
				{
					type: 'insert-add',
					at: 11,
					text: 'there',
					newNote: true,
				},
			],
		} );
	} );

	it( 'carries the HTML of an inserted run that has its own formatting', () => {
		const plan = planEditMarkers(
			rtd( 'Hello' ),
			rtd( 'Hello <strong>bold</strong>!' )
		);
		expect( plan.actions ).toHaveLength( 1 );
		expect( plan.actions[ 0 ].text ).toBe( ' bold!' );
		expect( plan.actions[ 0 ].html ).toBe( ' <strong>bold</strong>!' );
	} );

	it( 'omits the HTML when the inserted run is plain text', () => {
		const plan = planEditMarkers( rtd( 'Hello' ), rtd( 'Hello world' ) );
		expect( plan.actions[ 0 ] ).not.toHaveProperty( 'html' );
	} );

	it( 'omits the HTML when the inserted run already carries a marker', () => {
		// Pasting content that already holds a marker must not nest one
		// marker inside another.
		const plan = planEditMarkers(
			rtd( 'Hello' ),
			rtd( 'Hello ' + add( 3, 'pasted', 2 ) )
		);
		expect( plan.actions[ 0 ] ).not.toHaveProperty( 'html' );
	} );

	it( 'widens a mid-word correction to the whole word', () => {
		// "teh" -> "the" shares a leading "t" and a trailing "e", so the raw
		// prefix/suffix trim proposes delete "eh" plus add "he" — which renders
		// as "tehhe" and quotes word fragments in the sidebar (F-27, IR-08).
		expect(
			planEditMarkers(
				rtd( 'a teh common typo' ),
				rtd( 'a the common typo' )
			)
		).toEqual( {
			kind: 'replace',
			actions: [
				{ type: 'wrap-del', start: 2, end: 5, newNote: true },
				{ type: 'insert-add', at: 5, text: 'the', newNote: true },
			],
		} );
	} );

	it( 'does not widen a replacement into an existing marker', () => {
		// Widening past a marker boundary would wrap someone's pending run in
		// a second marker, so the narrow edit is used instead.
		const prev = rtd( `x${ add( 9, 'ab', 2 ) }cd` );
		const plan = planEditMarkers( prev, rtd( 'xabcZ' ), { authorId: 2 } );
		expect( plan.kind ).toBe( 'replace' );
		expect( plan.actions ).toEqual( [
			{ type: 'wrap-del', start: 4, end: 5, newNote: true },
			{ type: 'insert-add', at: 5, text: 'Z', newNote: true },
		] );
	} );
} );

describe( 'widenReplaceToWords', () => {
	it( 'leaves a non-replace edit alone', () => {
		const edit = analyzeTextEdit( 'ab', 'abc' );
		expect( widenReplaceToWords( 'ab', 'abc', edit ) ).toBe( edit );
	} );

	it( 'extends both ends to the surrounding word boundaries', () => {
		const prev = 'one tea three';
		const next = 'one sea three';
		const edit = analyzeTextEdit( prev, next );
		// The raw edit is the single character "t" -> "s".
		expect( edit ).toEqual(
			expect.objectContaining( { removedText: 't', insertedText: 's' } )
		);
		expect( widenReplaceToWords( prev, next, edit ) ).toEqual(
			expect.objectContaining( {
				kind: 'replace',
				start: 4,
				end: 7,
				removedText: 'tea',
				insertedText: 'sea',
			} )
		);
	} );

	it( 'stops widening at a whitespace boundary', () => {
		const prev = 'alpha beta gamma';
		const next = 'alpha BETA gamma';
		const edit = analyzeTextEdit( prev, next );
		const widened = widenReplaceToWords( prev, next, edit );
		expect( widened.removedText ).toBe( 'beta' );
		expect( widened.insertedText ).toBe( 'BETA' );
	} );

	it( 'caps widening so separator-free text is not swallowed whole', () => {
		const prev = 'x'.repeat( 200 ) + 'a' + 'y'.repeat( 200 );
		const next = 'x'.repeat( 200 ) + 'bc' + 'y'.repeat( 200 );
		const edit = analyzeTextEdit( prev, next );
		const widened = widenReplaceToWords( prev, next, edit );
		expect( widened.removedText.length ).toBeLessThanOrEqual( 81 );
	} );
} );

describe( 'applyEditPlan', () => {
	beforeAll( () => {
		registerSuggestionFormat();
	} );

	afterAll( () => {
		if ( getFormatType( SUGGESTION_FORMAT_NAME ) ) {
			unregisterFormatType( SUGGESTION_FORMAT_NAME );
		}
	} );

	it( 'wraps an insert-add in a new marker with the supplied id', () => {
		const { actions } = planEditMarkers(
			rtd( 'Hello' ),
			rtd( 'Hello world' )
		);
		const result = applyEditPlan( rtd( 'Hello' ), actions, {
			authorId: 2,
			ids: [ 10 ],
		} );
		const html = result.toHTMLString();
		expect( html ).toContain( 'data-suggestion-id="10"' );
		expect( html ).toContain( 'data-suggestion-type="add"' );
		expect( findSuggestionText( result, 10 ) ).toBe( ' world' );
	} );

	it( 'grows an existing add marker without a new id', () => {
		const prev = rtd( add( 7, 'new', 2 ) );
		const { actions } = planEditMarkers(
			prev,
			rtd( add( 7, 'new', 2 ) + 's' ),
			{ authorId: 2 }
		);
		const result = applyEditPlan( prev, actions, {
			authorId: 2,
			ids: [],
		} );
		expect( findSuggestionText( result, 7 ) ).toBe( 'news' );
	} );

	it( 'grows an existing add marker from inside, as one marker', () => {
		const prev = rtd( 'Hello ' + add( 41, 'ADDED', 2 ) );
		const { actions } = planEditMarkers(
			prev,
			rtd( 'Hello ' + add( 41, 'ADDXXED', 2 ) ),
			{ authorId: 2 }
		);
		const result = applyEditPlan( prev, actions, {
			authorId: 2,
			ids: [],
		} );
		const html = result.toHTMLString();
		// One marker, one id, the typed text inside it.
		expect( html.match( /<mark/g ) ).toHaveLength( 1 );
		expect( findSuggestionText( result, 41 ) ).toBe( 'ADDXXED' );
		expect( html ).toContain( 'data-author="2"' );
	} );

	it( 'wraps a deletion, keeping the text struck through', () => {
		const prev = rtd( 'Hello world' );
		const { actions } = planEditMarkers( prev, rtd( 'Hello' ) );
		const result = applyEditPlan( prev, actions, {
			authorId: 2,
			ids: [ 20 ],
		} );
		const html = result.toHTMLString();
		expect( html ).toContain( 'data-suggestion-type="del"' );
		expect( findSuggestionText( result, 20 ) ).toBe( ' world' );
		// The removed text survives (it is proposed for deletion, not gone).
		expect( result.toHTMLString() ).toContain( 'world' );
	} );

	it( 'removes the author own pending addition', () => {
		const prev = rtd( 'keep ' + add( 8, 'gone', 2 ) );
		// The author deletes their own pending addition, so the text loses 'gone'.
		const { actions } = planEditMarkers( prev, rtd( 'keep ' ), {
			authorId: 2,
		} );
		// The plan for deleting an own addition is a remove-add.
		const result = applyEditPlan( prev, actions, { authorId: 2 } );
		expect( findSuggestionRange( result, 8 ) ).toBeNull();
		expect( result.toHTMLString() ).not.toContain( 'gone' );
	} );

	it( 'applies a widened correction as a whole-word del + add pair', () => {
		const prev = rtd( 'a teh common typo' );
		const { actions } = planEditMarkers( prev, rtd( 'a the common typo' ) );
		const result = applyEditPlan( prev, actions, {
			authorId: 2,
			ids: [ 40, 41 ],
		} );
		expect( findSuggestionText( result, 40 ) ).toBe( 'teh' );
		expect( findSuggestionText( result, 41 ) ).toBe( 'the' );
	} );

	it( 'applies a type-over as a del + add pair', () => {
		const prev = rtd( 'Hello world' );
		const { actions } = planEditMarkers( prev, rtd( 'Hello there' ) );
		const result = applyEditPlan( prev, actions, {
			authorId: 2,
			ids: [ 30, 31 ],
		} );
		expect( findSuggestionText( result, 30 ) ).toBe( 'world' );
		expect( findSuggestionText( result, 31 ) ).toBe( 'there' );
	} );

	it( 'keeps the formatting of a rich inserted run', () => {
		const prev = rtd( 'Hello' );
		const next = rtd(
			'Hello <strong>bold</strong> and <a href="https://example.com">a link</a>'
		);
		const { actions } = planEditMarkers( prev, next );
		const result = applyEditPlan( prev, actions, {
			authorId: 2,
			ids: [ 40 ],
		} );
		const html = result.toHTMLString();
		expect( findSuggestionText( result, 40 ) ).toBe( ' bold and a link' );
		expect( html ).toContain( '<strong>bold</strong>' );
		expect( html ).toContain( '<a href="https://example.com">' );
	} );

	it( 'keeps the formatting of a rich run pasted over a selection', () => {
		const prev = rtd( 'Hello world' );
		const next = rtd( 'Hello <a href="https://example.com">there</a>' );
		const { actions } = planEditMarkers( prev, next );
		const result = applyEditPlan( prev, actions, {
			authorId: 2,
			ids: [ 50, 51 ],
		} );
		expect( findSuggestionText( result, 50 ) ).toBe( 'world' );
		expect( findSuggestionText( result, 51 ) ).toBe( 'there' );
		expect( result.toHTMLString() ).toContain(
			'<a href="https://example.com">'
		);
	} );
} );
