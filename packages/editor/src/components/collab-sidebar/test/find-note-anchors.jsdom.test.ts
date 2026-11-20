import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
	getBlockTypes,
	parse,
	registerBlockType,
	unregisterBlockType,
	type Block,
} from '@wordpress/blocks';
import { createElement, RawHTML } from '@wordpress/element';
import { findNoteAnchors } from '../find-note-anchors';

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
	return { id, parent: 0, meta: { _wp_note_anchor: [ { path, content } ] } };
}

describe( 'findNoteAnchors', () => {
	beforeAll( () => {
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
		for ( const { name } of getBlockTypes() ) {
			unregisterBlockType( name );
		}
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
} );
