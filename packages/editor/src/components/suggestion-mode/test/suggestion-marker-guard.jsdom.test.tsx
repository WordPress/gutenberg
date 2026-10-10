/**
 * The marker guard: content that reaches the block editor carrying two
 * markers of one kind over the same characters (a real-time collaboration
 * merge) is resolved once, the same way on every peer.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { RegistryProvider, createRegistry } from '@wordpress/data';
// @ts-expect-error No exported types
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
	const content = () =>
		registry.select( blockEditorStore ).getBlockAttributes( block.clientId )
			.content;
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

	it( 'gives overlapping same-kind characters to the older note, once', async () => {
		const { writes, content } = setup(
			`a${ mark( 21, `b${ mark( 20, 'cd' ) }` ) }e`
		);
		await act( async () => {} );
		expect( findSuggestionText( content(), 20 ) ).toBe( 'cd' );
		expect( findSuggestionText( content(), 21 ) ).toBe( 'b' );
		expect( writes ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'resolves content that arrives later, and only touches what needs it', async () => {
		const { registry, block, writes, content } = setup( 'plain' );
		await act( async () => {} );
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
		expect( findSuggestionText( content(), 9 ) ).toBe( 'y' );
		// The incoming write plus one correction.
		expect( writes ).toHaveBeenCalledTimes( 2 );
	} );
} );
