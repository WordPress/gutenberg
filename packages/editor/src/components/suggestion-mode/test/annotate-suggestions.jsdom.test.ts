import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { createElement } from '@wordpress/element';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { store as annotationsStore } from '@wordpress/annotations';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { store as preferencesStore } from '@wordpress/preferences';
import {
	createBlock,
	getBlockTypes,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import { RichTextData } from '@wordpress/rich-text';
import {
	suggestionAnnotations,
	useAnnotateSuggestionThreads,
} from '../annotate-suggestions';
import {
	unregisterSuggestionFormats,
	registerSuggestionFormat,
} from '../../inline-suggestions';
import { store as editorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

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

describe( 'useAnnotateSuggestionThreads', () => {
	const BLOCK = 'core/test-annotate-paragraph';
	const marker = ( id: number, text: string ) =>
		`<mark class="wp-suggestion-del" data-suggestion-id="${ id }" data-suggestion-type="del">${ text }</mark>`;

	beforeAll( () => {
		registerSuggestionFormat();
		registerBlockType( BLOCK, {
			apiVersion: 3,
			title: 'Annotate paragraph',
			category: 'text',
			attributes: { content: { type: 'rich-text' } },
			save: () => null,
		} as any );
	} );

	afterAll( () => {
		unregisterSuggestionFormats();
		getBlockTypes().forEach( ( type ) => unregisterBlockType( type.name ) );
	} );

	function setup() {
		const registry = createRegistry();
		registry.register( coreStore );
		registry.register( preferencesStore );
		registry.register( blockEditorStore );
		registry.register( editorStore );
		registry.register( annotationsStore );
		const block = createBlock( BLOCK, {
			content: RichTextData.fromHTMLString(
				`a${ marker( 6, 'bc' ) }d${ marker( 5, 'ef' ) }g`
			),
		} );
		registry.dispatch( blockEditorStore ).resetBlocks( [ block ] );
		const threads = [ 5, 6 ].map( ( id ) => ( {
			id,
			status: 'hold',
			blockClientId: block.clientId,
			meta: { _wp_suggestion: delPayload() },
		} ) );
		renderHook( () => useAnnotateSuggestionThreads( threads ), {
			wrapper: ( { children } ) =>
				createElement(
					RegistryProvider,
					{ value: registry },
					children
				),
		} );
		const annotatedIds = () =>
			(
				registry
					.select( annotationsStore )
					.__experimentalGetAllAnnotationsForBlock(
						block.clientId
					) as any[]
			 ).map( ( annotation ) => annotation.id );
		return { registry, block, annotatedIds };
	}

	it( 'decorates only the selected suggestion', async () => {
		const { registry, annotatedIds } = setup();
		expect( annotatedIds() ).toEqual( [] );

		await act( async () => {
			unlock( registry.dispatch( editorStore ) ).selectNote( 6 );
		} );
		expect( annotatedIds() ).toEqual( [ '6' ] );
	} );

	it( 'leaves the annotations alone while an unselected marker grows', async () => {
		const { registry, block, annotatedIds } = setup();
		await act( async () => {
			unlock( registry.dispatch( editorStore ) ).selectNote( 6 );
		} );
		const changes = vi.fn();
		registry.subscribe( changes, annotationsStore );

		// A collaborator typing into suggestion 5 grows its marker.
		await act( async () => {
			registry
				.dispatch( blockEditorStore )
				.updateBlockAttributes( block.clientId, {
					content: RichTextData.fromHTMLString(
						`a${ marker( 6, 'bc' ) }d${ marker( 5, 'efx' ) }g`
					),
				} );
		} );

		expect( changes ).not.toHaveBeenCalled();
		expect( annotatedIds() ).toEqual( [ '6' ] );
	} );
} );
