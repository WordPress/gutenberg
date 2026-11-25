import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { RichTextData } from '@wordpress/rich-text';
import { findInlineMarker } from '../anchor-index';
import {
	registerSuggestionFormat,
	unregisterSuggestionFormats,
} from '../../inline-suggestions';

// The block-editor store pulls in `@wordpress/viewport`, which reads
// `window.matchMedia` while loading.
vi.hoisted( () => {
	globalThis.wpVitest.mockMatchMedia();
} );

const marked = ( id: number ) =>
	`Hello <mark class="wp-suggestion-add" data-suggestion-id="${ id }" data-suggestion-type="add">world</mark>`;

function blockEditorWith( blocks: Record< string, Record< string, any > > ) {
	return {
		getClientIdsWithDescendants: () => Object.keys( blocks ),
		getBlockAttributes: ( clientId: string ) => blocks[ clientId ] ?? null,
	};
}

describe( 'findInlineMarker', () => {
	beforeAll( () => {
		registerSuggestionFormat();
	} );

	afterAll( () => {
		unregisterSuggestionFormats();
	} );

	it( 'finds the marker where the hint says it is', () => {
		const blockEditor = blockEditorWith( {
			a: { content: 'Plain' },
			b: { content: marked( 9 ) },
		} );
		expect(
			findInlineMarker( blockEditor, 9, {
				clientId: 'b',
				attribute: 'content',
			} )
		).toEqual( { clientId: 'b', attribute: 'content' } );
	} );

	it( 'finds a marker that left the block its note is linked to', () => {
		// Merging two paragraphs keeps the first block and its metadata.
		const blockEditor = blockEditorWith( {
			a: { content: marked( 9 ) },
			b: { content: 'Plain', metadata: { noteId: [ 9 ] } },
		} );
		expect(
			findInlineMarker( blockEditor, 9, {
				clientId: 'b',
				attribute: 'content',
			} )
		).toEqual( { clientId: 'a', attribute: 'content' } );
	} );

	it( 'finds a marker in an attribute the payload does not name', () => {
		const blockEditor = blockEditorWith( {
			a: {
				value: RichTextData.fromHTMLString( marked( 9 ) ),
				citation: 'Plain',
			},
		} );
		expect(
			findInlineMarker( blockEditor, 9, { attribute: 'content' } )
		).toEqual( { clientId: 'a', attribute: 'value' } );
	} );

	it( 'does not take another note’s marker for it', () => {
		const blockEditor = blockEditorWith( {
			a: { content: marked( 90 ) },
		} );
		expect( findInlineMarker( blockEditor, 9 ) ).toBeNull();
	} );
} );
