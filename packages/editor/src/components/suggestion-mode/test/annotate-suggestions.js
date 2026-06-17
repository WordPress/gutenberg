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
import { suggestionAnnotations } from '../annotate-suggestions';
import {
	SUGGESTION_FORMAT_NAME,
	suggestionFormat,
} from '../../inline-suggestions';

const isRegistered = () =>
	!! select( richTextStore ).getFormatType( SUGGESTION_FORMAT_NAME );

const delPayload = ( attribute = 'content' ) =>
	JSON.stringify( {
		schemaVersion: 2,
		operations: [
			{ type: 'inline-suggestion', attribute, suggestionType: 'del' },
		],
	} );

// "keep " (5 chars) then the marked "remove me" (9 chars) → range 5..14.
const markedContent = ( id ) =>
	RichTextData.fromHTMLString(
		`keep <mark class="wp-suggestion" data-suggestion-id="${ id }" data-suggestion-type="del">remove me</mark> tail`
	);

describe( 'suggestionAnnotations', () => {
	beforeAll( () => {
		if ( ! isRegistered() ) {
			registerFormatType( SUGGESTION_FORMAT_NAME, suggestionFormat );
		}
	} );

	afterAll( () => {
		if ( isRegistered() ) {
			unregisterFormatType( SUGGESTION_FORMAT_NAME );
		}
	} );

	it( 'returns an empty array for empty or missing threads', () => {
		expect( suggestionAnnotations( [], () => ( {} ) ) ).toEqual( [] );
		expect( suggestionAnnotations( undefined, () => ( {} ) ) ).toEqual(
			[]
		);
	} );

	it( 'resolves a del marker range for an unresolved inline-suggestion thread', () => {
		const threads = [
			{
				id: 5,
				status: 'hold',
				blockClientId: 'abc',
				meta: { _wp_suggestion: delPayload() },
			},
		];
		const getAttrs = ( clientId ) =>
			clientId === 'abc' ? { content: markedContent( 5 ) } : null;
		expect( suggestionAnnotations( threads, getAttrs ) ).toEqual( [
			{
				id: '5',
				clientId: 'abc',
				attributeKey: 'content',
				start: 5,
				end: 14,
			},
		] );
	} );

	it( 'skips resolved (non-hold) threads', () => {
		const threads = [
			{
				id: 5,
				status: 'approved',
				blockClientId: 'abc',
				meta: { _wp_suggestion: delPayload() },
			},
		];
		expect(
			suggestionAnnotations( threads, () => ( {
				content: markedContent( 5 ),
			} ) )
		).toEqual( [] );
	} );

	it( 'skips threads without a linked block', () => {
		const threads = [
			{
				id: 5,
				status: 'hold',
				blockClientId: null,
				meta: { _wp_suggestion: delPayload() },
			},
		];
		expect(
			suggestionAnnotations( threads, () => ( {
				content: markedContent( 5 ),
			} ) )
		).toEqual( [] );
	} );

	it( 'skips threads with no inline-suggestion op (e.g. a plain note)', () => {
		const threads = [
			{ id: 5, status: 'hold', blockClientId: 'abc', meta: {} },
		];
		expect(
			suggestionAnnotations( threads, () => ( {
				content: markedContent( 5 ),
			} ) )
		).toEqual( [] );
	} );

	it( 'skips when the marker is gone from content (id no longer found)', () => {
		const threads = [
			{
				id: 5,
				status: 'hold',
				blockClientId: 'abc',
				meta: { _wp_suggestion: delPayload() },
			},
		];
		// The block content carries a different marker id, so the anchor for
		// thread 5 can't be resolved and the suggestion isn't decorated.
		expect(
			suggestionAnnotations( threads, () => ( {
				content: markedContent( 99 ),
			} ) )
		).toEqual( [] );
	} );
} );
