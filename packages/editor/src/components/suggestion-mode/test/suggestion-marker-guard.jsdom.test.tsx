/**
 * The marker guard: content that reaches the block editor with stacked
 * markers out of canonical order (a real-time collaboration merge) is put in
 * order once, the same way on every peer, keeping every marker.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { RegistryProvider, createRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import {
	createBlock,
	getBlockTypes,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import { RichTextData } from '@wordpress/rich-text';
import {
	findSuggestionText,
	registerSuggestionFormat,
	unregisterSuggestionFormats,
} from '../../inline-suggestions';
import SuggestionMarkerGuard from '../suggestion-marker-guard';
import { SuggestionSessionProvider } from '../suggestion-session';

// Attribute values are `unknown` in the store types; the tests read them
// as the blocks define them.
const attributesOf = ( registry: any, clientId: string ): any =>
	registry.select( blockEditorStore ).getBlockAttributes( clientId );

vi.hoisted( () => {
	globalThis.wpVitest.mockMatchMedia();
} );

const BLOCK = 'core/test-guard-paragraph';

const mark = ( id: number, inner: string ) =>
	`<mark data-suggestion-id="${ id }" data-suggestion-type="del" data-author="${ id }" class="wp-suggestion-del">${ inner }</mark>`;

function setup( html: string ) {
	const registry = createRegistry();
	registry.register( blockEditorStore );
	const block = createBlock( BLOCK, {
		content: RichTextData.fromHTMLString( html ),
	} );
	registry.dispatch( blockEditorStore ).resetBlocks( [ block ] );
	const writes = vi.spyOn(
		registry.dispatch( blockEditorStore ),
		'updateBlockAttributes'
	);
	render(
		<RegistryProvider value={ registry }>
			<SuggestionSessionProvider>
				<SuggestionMarkerGuard />
			</SuggestionSessionProvider>
		</RegistryProvider>
	);
	const content = () => attributesOf( registry, block.clientId ).content;
	return { registry, block, writes, content };
}

describe( 'SuggestionMarkerGuard', () => {
	beforeAll( () => {
		registerSuggestionFormat();
		registerBlockType( BLOCK, {
			apiVersion: 3,
			title: 'Guard paragraph',
			category: 'text',
			attributes: { content: { type: 'rich-text' } },
			save: () => null,
		} as any );
	} );

	afterAll( () => {
		unregisterSuggestionFormats();
		getBlockTypes().forEach( ( type ) => unregisterBlockType( type.name ) );
	} );

	it( 'puts a merged stack in canonical order once, keeping both markers', async () => {
		const { writes, content } = setup(
			`a${ mark( 21, `b${ mark( 20, 'cd' ) }` ) }e`
		);
		expect( findSuggestionText( content(), 20 ) ).toBe( 'cd' );
		expect( findSuggestionText( content(), 21 ) ).toBe( 'bcd' );
		expect( content().toHTMLString() ).toBe(
			`a${ mark( 21, 'b' ) }${ mark( 20, mark( 21, 'cd' ) ) }e`
		);
		expect( writes ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'leaves a canonical stack alone', async () => {
		const { writes } = setup(
			`a${ mark( 20, `b${ mark( 21, 'cd' ) }` ) }e`
		);
		expect( writes ).not.toHaveBeenCalled();
	} );

	it( 'resolves content that arrives later, and only touches what needs it', async () => {
		const { registry, block, writes, content } = setup( 'plain' );
		expect( writes ).not.toHaveBeenCalled();
		await act( async () => {
			registry
				.dispatch( blockEditorStore )
				.updateBlockAttributes( block.clientId, {
					content: RichTextData.fromHTMLString(
						`x${ mark( 9, `y${ mark( 4, 'z' ) }` ) }`
					),
				} );
		} );
		expect( findSuggestionText( content(), 4 ) ).toBe( 'z' );
		expect( findSuggestionText( content(), 9 ) ).toBe( 'yz' );
		// The incoming write plus one correction.
		expect( writes ).toHaveBeenCalledTimes( 2 );
	} );
} );
