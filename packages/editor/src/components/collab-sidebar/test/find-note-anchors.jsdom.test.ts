import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
	getBlockTypes,
	parse,
	registerBlockType,
	serialize,
	unregisterBlockType,
	type Block,
} from '@wordpress/blocks';
import { createElement, RawHTML } from '@wordpress/element';
import {
	RichTextData,
	registerFormatType,
	unregisterFormatType,
} from '@wordpress/rich-text';
import { findNoteAnchors } from '../find-note-anchors';
import { findNoteInBlock } from '../utils/note-anchor';

function paragraph( html: string, noteIds?: number[] ) {
	const attributes = noteIds
		? ` {"metadata":{"noteId":${ JSON.stringify( noteIds ) }}}`
		: '';
	return `<!-- wp:test/paragraph${ attributes } --><p>${ html }</p><!-- /wp:test/paragraph -->`;
}

function group( ...inner: string[] ) {
	return `<!-- wp:test/group -->${ inner.join( '' ) }<!-- /wp:test/group -->`;
}

function blocksFrom( content: string ) {
	return parse( content ) as Block< Record< string, any > >[];
}

function orphan( id: number, path: number[], content: string ) {
	return { id, anchors: [ { path, content } ] };
}

describe( 'findNoteAnchors', () => {
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
		const result = findNoteAnchors(
			[ orphan( 7, [ 1 ], paragraph( 'Two' ) ) ],
			blocks
		);

		expect( result ).toEqual( {
			[ blocks[ 1 ].clientId ]: { metadata: { noteId: [ 7 ] } },
		} );
	} );

	it( 'follows a block that moved when it is the only match', () => {
		const blocks = blocksFrom( paragraph( 'New' ) + paragraph( 'Target' ) );
		const result = findNoteAnchors(
			[ orphan( 7, [ 0 ], paragraph( 'Target' ) ) ],
			blocks
		);

		expect( Object.keys( result ) ).toEqual( [ blocks[ 1 ].clientId ] );
	} );

	it( 'leaves the note orphaned when a moved block has duplicates', () => {
		const blocks = blocksFrom(
			paragraph( 'New' ) + paragraph( 'Same' ) + paragraph( 'Same' )
		);
		const result = findNoteAnchors(
			[ orphan( 7, [ 0 ], paragraph( 'Same' ) ) ],
			blocks
		);

		expect( result ).toEqual( {} );
	} );

	it( 'leaves the note orphaned when the block changed', () => {
		const blocks = blocksFrom( paragraph( 'Rewritten' ) );
		const result = findNoteAnchors(
			[ orphan( 7, [ 0 ], paragraph( 'Original' ) ) ],
			blocks
		);

		expect( result ).toEqual( {} );
	} );

	it( 'ignores other notes on the block when matching', () => {
		const blocks = blocksFrom( paragraph( 'Shared', [ 3 ] ) );
		const result = findNoteAnchors(
			[ orphan( 7, [ 0 ], paragraph( 'Shared', [ 3, 5 ] ) ) ],
			blocks
		);

		expect( result[ blocks[ 0 ].clientId ].metadata ).toEqual( {
			noteId: [ 3, 7 ],
		} );
	} );

	it( 'places two notes on the same block', () => {
		const blocks = blocksFrom( paragraph( 'Popular' ) );
		const result = findNoteAnchors(
			[
				orphan( 7, [ 0 ], paragraph( 'Popular' ) ),
				orphan( 8, [ 0 ], paragraph( 'Popular' ) ),
			],
			blocks
		);

		expect( result[ blocks[ 0 ].clientId ].metadata ).toEqual( {
			noteId: [ 7, 8 ],
		} );
	} );

	it( 'restores the draft marker of an inline note with the note id', () => {
		const blocks = blocksFrom( paragraph( 'Keep me attached' ) );
		const result = findNoteAnchors(
			[
				orphan(
					7,
					[ 0 ],
					paragraph(
						'<mark class="wp-note" data-id="new">Keep</mark> me attached'
					)
				),
			],
			blocks
		);

		const patch = result[ blocks[ 0 ].clientId ];
		expect( patch.content ).toBeInstanceOf( RichTextData );
		expect( findNoteInBlock( patch, 7 ) ).toEqual( {
			attributeKey: 'content',
			start: 0,
			end: 4,
		} );
		expect( findNoteInBlock( patch, 'new' ) ).toBeNull();
	} );

	it( 'finds a nested block by its path', () => {
		const blocks = blocksFrom(
			group( paragraph( 'Same' ), paragraph( 'Same' ) )
		);
		const result = findNoteAnchors(
			[ orphan( 7, [ 0, 1 ], paragraph( 'Same' ) ) ],
			blocks
		);

		expect( Object.keys( result ) ).toEqual( [
			blocks[ 0 ].innerBlocks[ 1 ].clientId,
		] );
	} );

	it( 'reads the snapshot the editor writes', () => {
		const blocks = blocksFrom( paragraph( 'Round trip' ) );
		const result = findNoteAnchors(
			[ orphan( 7, [ 0 ], serialize( blocks[ 0 ] ) ) ],
			blocks
		);

		expect( result[ blocks[ 0 ].clientId ].metadata ).toEqual( {
			noteId: [ 7 ],
		} );
	} );
} );
