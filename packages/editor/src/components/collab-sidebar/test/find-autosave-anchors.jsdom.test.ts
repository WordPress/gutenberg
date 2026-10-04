import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
	createBlock,
	getBlockTypes,
	parse,
	registerBlockType,
	unregisterBlockType,
	type Block,
} from '@wordpress/blocks';
import { createElement, RawHTML } from '@wordpress/element';
import {
	RichTextData,
	registerFormatType,
	unregisterFormatType,
} from '@wordpress/rich-text';
import { findAutosaveAnchors } from '../find-autosave-anchors';
import { findNoteInBlock, getNoteIdsFromMetadata } from '../utils';

const POST_MODIFIED = '2026-01-01T00:00:00';
const NEWER = '2026-01-01T00:05:00';

function paragraph( text: string, noteIds?: number[] ) {
	const attributes = noteIds
		? ` {"metadata":{"noteId":${ JSON.stringify( noteIds ) }}}`
		: '';
	return `<!-- wp:test/paragraph${ attributes } --><p>${ text }</p><!-- /wp:test/paragraph -->`;
}

function group( ...inner: string[] ) {
	return `<!-- wp:test/group -->${ inner.join( '' ) }<!-- /wp:test/group -->`;
}

function blocksFrom( content: string ) {
	return parse( content ) as Block< Record< string, any > >[];
}

function autosaveOf( content: string, modifiedGmt = NEWER ) {
	return { content: { raw: content }, modified_gmt: modifiedGmt };
}

describe( 'findAutosaveAnchors', () => {
	beforeAll( () => {
		registerFormatType( 'core/note', {
			title: 'Note',
			tagName: 'mark',
			className: 'wp-note',
			attributes: { 'data-id': 'data-id' },
			edit: () => null,
		} as Parameters< typeof registerFormatType >[ 1 ] );
		registerBlockType( 'test/paragraph', {
			apiVersion: 3,
			title: 'Paragraph',
			category: 'text',
			attributes: {
				content: {
					type: 'rich-text',
					source: 'rich-text',
					selector: 'p',
				},
				// Added by a block-editor hook in the editor.
				metadata: { type: 'object' },
			},
			save: ( {
				attributes,
			}: {
				attributes: Record< string, unknown >;
			} ) =>
				createElement( RawHTML, {
					children: `<p>${ attributes.content }</p>`,
				} ),
		} as Parameters< typeof registerBlockType >[ 1 ] );
		registerBlockType( 'test/group', {
			apiVersion: 3,
			title: 'Group',
			category: 'design',
			attributes: { metadata: { type: 'object' } },
			save: () => null,
		} as Parameters< typeof registerBlockType >[ 1 ] );
	} );

	afterAll( () => {
		unregisterFormatType( 'core/note' );
		for ( const { name } of getBlockTypes() ) {
			unregisterBlockType( name );
		}
	} );

	it( 'places a note on the block at the same position', () => {
		const blocks = blocksFrom( paragraph( 'One' ) + paragraph( 'Two' ) );
		const result = findAutosaveAnchors( {
			orphanNoteIds: [ 7 ],
			autosave: autosaveOf(
				paragraph( 'One' ) + paragraph( 'Two', [ 7 ] )
			),
			postModifiedGmt: POST_MODIFIED,
			blocks,
		} );

		expect( result.noteIds ).toEqual( [ 7 ] );
		expect(
			result.attributesByClientId[ blocks[ 1 ].clientId ].metadata
		).toEqual( { noteId: [ 7 ] } );
	} );

	it( 'follows a block that moved when it is the only match', () => {
		const blocks = blocksFrom( paragraph( 'New' ) + paragraph( 'Target' ) );
		const result = findAutosaveAnchors( {
			orphanNoteIds: [ 7 ],
			autosave: autosaveOf( paragraph( 'Target', [ 7 ] ) ),
			postModifiedGmt: POST_MODIFIED,
			blocks,
		} );

		expect( Object.keys( result.attributesByClientId ) ).toEqual( [
			blocks[ 1 ].clientId,
		] );
	} );

	it( 'leaves the note orphaned when a moved block has duplicates', () => {
		const result = findAutosaveAnchors( {
			orphanNoteIds: [ 7 ],
			autosave: autosaveOf( paragraph( 'Same', [ 7 ] ) ),
			postModifiedGmt: POST_MODIFIED,
			blocks: blocksFrom(
				paragraph( 'New' ) + paragraph( 'Same' ) + paragraph( 'Same' )
			),
		} );

		expect( result.noteIds ).toEqual( [] );
	} );

	it( 'leaves the note orphaned when the block changed', () => {
		const result = findAutosaveAnchors( {
			orphanNoteIds: [ 7 ],
			autosave: autosaveOf( paragraph( 'Before', [ 7 ] ) ),
			postModifiedGmt: POST_MODIFIED,
			blocks: blocksFrom( paragraph( 'After' ) ),
		} );

		expect( result.noteIds ).toEqual( [] );
	} );

	it( 'ignores an autosave that is not newer than the post', () => {
		const result = findAutosaveAnchors( {
			orphanNoteIds: [ 7 ],
			autosave: autosaveOf( paragraph( 'One', [ 7 ] ), POST_MODIFIED ),
			postModifiedGmt: POST_MODIFIED,
			blocks: blocksFrom( paragraph( 'One' ) ),
		} );

		expect( result.noteIds ).toEqual( [] );
	} );

	it( 'returns nothing without an autosave', () => {
		const result = findAutosaveAnchors( {
			orphanNoteIds: [ 7 ],
			autosave: undefined,
			postModifiedGmt: POST_MODIFIED,
			blocks: blocksFrom( paragraph( 'One' ) ),
		} );

		expect( result ).toEqual( { attributesByClientId: {}, noteIds: [] } );
	} );

	it( 'skips notes the autosave does not mention', () => {
		const result = findAutosaveAnchors( {
			orphanNoteIds: [ 7, 8 ],
			autosave: autosaveOf( paragraph( 'One', [ 7 ] ) ),
			postModifiedGmt: POST_MODIFIED,
			blocks: blocksFrom( paragraph( 'One' ) ),
		} );

		expect( result.noteIds ).toEqual( [ 7 ] );
	} );

	it( 'finds nested blocks by path', () => {
		const blocks = blocksFrom(
			group( paragraph( 'A' ), paragraph( 'B' ) )
		);
		const result = findAutosaveAnchors( {
			orphanNoteIds: [ 7 ],
			autosave: autosaveOf(
				group( paragraph( 'A' ), paragraph( 'B', [ 7 ] ) )
			),
			postModifiedGmt: POST_MODIFIED,
			blocks,
		} );

		expect( Object.keys( result.attributesByClientId ) ).toEqual( [
			blocks[ 0 ].innerBlocks[ 1 ].clientId,
		] );
	} );

	it( 'combines two notes placed on the same block', () => {
		const blocks = [
			createBlock( 'test/paragraph', {
				content: 'One',
				metadata: { noteId: [ 3 ] },
			} ),
		];
		const result = findAutosaveAnchors( {
			orphanNoteIds: [ 7, 8 ],
			autosave: autosaveOf( paragraph( 'One', [ 3, 7, 8 ] ) ),
			postModifiedGmt: POST_MODIFIED,
			blocks: blocks as Block< Record< string, any > >[],
		} );

		expect(
			getNoteIdsFromMetadata(
				result.attributesByClientId[ blocks[ 0 ].clientId ].metadata
			)
		).toEqual( [ 3, 7, 8 ] );
	} );

	it( 'restores an inline marker when the text is unchanged', () => {
		const blocks = blocksFrom( paragraph( 'Hello world' ) );
		const result = findAutosaveAnchors( {
			orphanNoteIds: [ 7 ],
			autosave: autosaveOf(
				paragraph(
					'Hello <mark class="wp-note" data-id="7">world</mark>',
					[ 7 ]
				)
			),
			postModifiedGmt: POST_MODIFIED,
			blocks,
		} );

		const patch = result.attributesByClientId[ blocks[ 0 ].clientId ];
		expect( patch.content ).toBeInstanceOf( RichTextData );
		expect( findNoteInBlock( patch, 7 ) ).toEqual( {
			attributeKey: 'content',
			start: 6,
			end: 11,
		} );
	} );
} );
