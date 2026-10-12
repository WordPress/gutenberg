import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { RichTextData } from '@wordpress/rich-text';
import { suggestionAnnotations } from '../annotate-suggestions';
import {
	unregisterSuggestionFormats,
	registerSuggestionFormat,
} from '../../inline-suggestions';

// The editor store pulls in `@wordpress/viewport`, which reads
// `window.matchMedia` while loading.
vi.hoisted( () => {
	globalThis.wpVitest.mockMatchMedia();
} );

const delPayload = ( attribute = 'content' ) =>
	JSON.stringify( {
		schemaVersion: 2,
		operations: [
			{ type: 'inline-suggestion', attribute, suggestionType: 'del' },
		],
	} );

// "keep " (5 chars) then the marked "remove me" (9 chars) → range 5..14.
const markedContent = ( id: number | string ) =>
	RichTextData.fromHTMLString(
		`keep <mark class="wp-suggestion-del" data-suggestion-id="${ id }" data-suggestion-type="del">remove me</mark> tail`
	);

describe( 'suggestionAnnotations', () => {
	beforeAll( () => {
		registerSuggestionFormat();
	} );

	afterAll( () => {
		unregisterSuggestionFormats();
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
		const getAttrs = ( clientId: string ) =>
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

	it( 'lists enclosing ranges first and the selected thread last', () => {
		/*
		 * The annotations API keeps one decoration per character, so where
		 * ranges overlap the later one wins. An addition holding someone's
		 * deletion is listed before it, and the selected thread after all.
		 */
		const content = RichTextData.fromHTMLString(
			'a<mark class="wp-suggestion-add" data-suggestion-id="1" data-suggestion-type="add">bc<mark class="wp-suggestion-del" data-suggestion-id="3" data-suggestion-type="del">de</mark>f</mark>g'
		);
		const thread = ( id: number, suggestionType: string ) => ( {
			id,
			status: 'hold',
			blockClientId: 'abc',
			meta: {
				_wp_suggestion: JSON.stringify( {
					schemaVersion: 2,
					operations: [
						{
							type: 'inline-suggestion',
							attribute: 'content',
							suggestionType,
						},
					],
				} ),
			},
		} );
		const threads = [ thread( 3, 'del' ), thread( 1, 'add' ) ];
		const ids = ( selected?: number ) =>
			suggestionAnnotations(
				threads,
				() => ( { content } ),
				selected
			).map( ( range ) => range.id );
		expect( ids() ).toEqual( [ '1', '3' ] );
		expect( ids( 3 ) ).toEqual( [ '1', '3' ] );
		expect( ids( 1 ) ).toEqual( [ '3', '1' ] );
	} );
} );
