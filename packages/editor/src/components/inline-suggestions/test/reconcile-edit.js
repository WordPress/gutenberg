/**
 * WordPress dependencies
 */
import {
	RichTextData,
	store as richTextStore,
	unregisterFormatType,
} from '@wordpress/rich-text';
import { select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { analyzeTextEdit, planEditMarkers } from '../reconcile-edit';
import { registerSuggestionFormat, SUGGESTION_FORMAT_NAME } from '../format';

const getFormatType = ( name ) => select( richTextStore ).getFormatType( name );

const add = ( id, text, author ) =>
	`<mark class="wp-suggestion" data-suggestion-id="${ id }" data-suggestion-type="add"${
		author !== undefined ? ` data-author="${ author }"` : ''
	}>${ text }</mark>`;

const del = ( id, text, author ) =>
	`<mark class="wp-suggestion" data-suggestion-id="${ id }" data-suggestion-type="del"${
		author !== undefined ? ` data-author="${ author }"` : ''
	}>${ text }</mark>`;

const rtd = ( html ) => RichTextData.fromHTMLString( html );

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
			actions: [ { type: 'grow-add', id: '7', text: 's' } ],
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

	it( 'does not act when typing inside an existing marker', () => {
		// Insert between the two characters of an existing add marker.
		const prev = rtd( add( 7, 'ab', 2 ) );
		const next = rtd( add( 7, 'aXb', 2 ) );
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
} );
