import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Y } from '@wordpress/sync';
import {
	collapseAttributeSets,
	expandAttributeSets,
	registerBlockAttributeMergeStrategy,
} from '../crdt-attribute-sets';
import {
	deserializeBlockAttributes,
	mergeCrdtBlocks,
	type Block,
	type YBlocks,
} from '../crdt-blocks';

interface Peer {
	ydoc: Y.Doc;
	yblocks: YBlocks;
}

/**
 * Create a collaborator with its own copy of the shared document.
 *
 * @param base Document state to start from, if any.
 */
function createPeer( base?: Uint8Array ): Peer {
	const ydoc = new Y.Doc();
	if ( base ) {
		Y.applyUpdate( ydoc, base );
	}

	return { ydoc, yblocks: ydoc.getArray( 'blocks' ) };
}

/**
 * Create a paragraph block with the given `metadata` attribute.
 *
 * @param metadata Value of the `metadata` attribute, if any.
 */
function createBlock( metadata?: Record< string, unknown > ): Block {
	const attributes: Block[ 'attributes' ] = {};
	if ( metadata ) {
		attributes.metadata = metadata;
	}

	return {
		name: 'core/paragraph',
		clientId: 'block-1',
		attributes,
		innerBlocks: [],
	};
}

/**
 * Write the block a collaborator's editor holds to that collaborator's
 * document.
 *
 * @param peer     Collaborator who made the change.
 * @param metadata The `metadata` attribute of the block after the change.
 */
function edit( peer: Peer, metadata?: Record< string, unknown > ): void {
	mergeCrdtBlocks( peer.yblocks, [ createBlock( metadata ) ], null );
}

/**
 * Read the `metadata` attribute the way a collaborator's editor receives it.
 *
 * @param peer Collaborator to read from.
 */
function readMetadata( peer: Peer ): unknown {
	const blocks = deserializeBlockAttributes( peer.yblocks.toJSON() );

	return blocks[ 0 ].attributes.metadata;
}

/**
 * Exchange all changes between two collaborators.
 *
 * @param a First collaborator.
 * @param b Second collaborator.
 */
function sync( a: Peer, b: Peer ): void {
	Y.applyUpdate( b.ydoc, Y.encodeStateAsUpdate( a.ydoc ) );
	Y.applyUpdate( a.ydoc, Y.encodeStateAsUpdate( b.ydoc ) );
}

describe( 'block attribute sets', () => {
	let unregister: () => void;

	beforeEach( () => {
		unregister = registerBlockAttributeMergeStrategy(
			'metadata.noteId',
			'set'
		);
	} );

	afterEach( () => {
		unregister();
	} );

	describe( 'expandAttributeSets', () => {
		it( 'moves each element to its own key', () => {
			expect(
				expandAttributeSets( {
					metadata: { name: 'Intro', noteId: [ 7, 3 ] },
				} )
			).toEqual( {
				metadata: { name: 'Intro' },
				'metadata.noteId#7': 7,
				'metadata.noteId#3': 3,
			} );
		} );

		it( 'removes the attribute when the set was its only property', () => {
			expect(
				expandAttributeSets( { metadata: { noteId: [ 3 ] } } )
			).toEqual( { 'metadata.noteId#3': 3 } );
		} );

		it( 'treats a single value as a set of one', () => {
			expect(
				expandAttributeSets( { metadata: { noteId: '3' } } )
			).toEqual( { 'metadata.noteId#3': '3' } );
		} );

		it( 'leaves a value alone when it is not a list of strings or numbers', () => {
			const attributes = { metadata: { noteId: [ { id: 3 } ] } };

			expect( expandAttributeSets( attributes ) ).toBe( attributes );
		} );

		it( 'leaves attributes without the set alone', () => {
			const attributes = { metadata: { name: 'Intro' }, level: 2 };

			expect( expandAttributeSets( attributes ) ).toBe( attributes );
		} );

		it( 'does not change the attributes it is given', () => {
			const attributes = { metadata: { noteId: [ 3 ] } };
			expandAttributeSets( attributes );

			expect( attributes ).toEqual( { metadata: { noteId: [ 3 ] } } );
		} );
	} );

	describe( 'collapseAttributeSets', () => {
		it( 'puts the elements back into the attribute, sorted', () => {
			expect(
				collapseAttributeSets( {
					metadata: { name: 'Intro' },
					'metadata.noteId#7': 7,
					'metadata.noteId#3': 3,
				} )
			).toEqual( { metadata: { name: 'Intro', noteId: [ 3, 7 ] } } );
		} );

		it( 'creates the attribute when it does not exist', () => {
			expect(
				collapseAttributeSets( { 'metadata.noteId#3': 3 } )
			).toEqual( { metadata: { noteId: [ 3 ] } } );
		} );

		it( 'keeps elements stored inside the attribute by older code', () => {
			expect(
				collapseAttributeSets( {
					metadata: { noteId: [ 3 ] },
					'metadata.noteId#7': 7,
				} )
			).toEqual( { metadata: { noteId: [ 3, 7 ] } } );
		} );

		it( 'skips values that are not strings or numbers', () => {
			expect(
				collapseAttributeSets( {
					'metadata.noteId#3': 3,
					'metadata.noteId#x': { id: 4 },
				} )
			).toEqual( { metadata: { noteId: [ 3 ] } } );
		} );

		it( 'leaves attributes without set keys alone', () => {
			const attributes = { metadata: { noteId: 3 } };

			expect( collapseAttributeSets( attributes ) ).toBe( attributes );
		} );
	} );

	describe( 'in a shared document', () => {
		it( 'keeps both elements when collaborators add at the same time', () => {
			const a = createPeer();
			edit( a, { name: 'Intro' } );
			const b = createPeer( Y.encodeStateAsUpdate( a.ydoc ) );

			edit( a, { name: 'Intro', noteId: [ 1 ] } );
			edit( b, { name: 'Intro', noteId: [ 2 ] } );
			sync( a, b );

			const expected = { name: 'Intro', noteId: [ 1, 2 ] };
			expect( readMetadata( a ) ).toEqual( expected );
			expect( readMetadata( b ) ).toEqual( expected );
		} );

		it( 'keeps both elements when the block had no attribute yet', () => {
			const a = createPeer();
			edit( a );
			const b = createPeer( Y.encodeStateAsUpdate( a.ydoc ) );

			edit( a, { noteId: [ 1 ] } );
			edit( b, { noteId: [ 2 ] } );
			sync( a, b );

			expect( readMetadata( a ) ).toEqual( { noteId: [ 1, 2 ] } );
			expect( readMetadata( b ) ).toEqual( { noteId: [ 1, 2 ] } );
		} );

		it( 'needs no collaborator online to merge', () => {
			const a = createPeer();
			edit( a );
			const b = createPeer( Y.encodeStateAsUpdate( a.ydoc ) );

			// Both collaborators add a note and leave. Only their updates
			// remain, as a sync server would hold them.
			edit( a, { noteId: [ 1 ] } );
			edit( b, { noteId: [ 2 ] } );
			const updates = [
				Y.encodeStateAsUpdate( a.ydoc ),
				Y.encodeStateAsUpdate( b.ydoc ),
			];

			const late = createPeer( Y.mergeUpdates( updates ) );

			expect( readMetadata( late ) ).toEqual( { noteId: [ 1, 2 ] } );
		} );

		it( 'keeps a removal made while another collaborator adds', () => {
			const a = createPeer();
			edit( a, { noteId: [ 1, 2 ] } );
			const b = createPeer( Y.encodeStateAsUpdate( a.ydoc ) );

			edit( a, { noteId: [ 2 ] } );
			edit( b, { noteId: [ 1, 2, 3 ] } );
			sync( a, b );

			expect( readMetadata( a ) ).toEqual( { noteId: [ 2, 3 ] } );
			expect( readMetadata( b ) ).toEqual( { noteId: [ 2, 3 ] } );
		} );

		it( 'keeps a removal made while another collaborator changes the same attribute', () => {
			const a = createPeer();
			edit( a, { noteId: [ 1 ] } );
			const b = createPeer( Y.encodeStateAsUpdate( a.ydoc ) );

			edit( a );
			edit( b, { name: 'Intro', noteId: [ 1 ] } );
			sync( a, b );

			expect( readMetadata( a ) ).toEqual( { name: 'Intro' } );
			expect( readMetadata( b ) ).toEqual( { name: 'Intro' } );
		} );

		it( 'moves a list stored inside the attribute to its own keys on the next change', () => {
			const a = createPeer();

			// Written before the path was registered as a set.
			unregister();
			edit( a, { noteId: [ 1 ] } );
			unregister = registerBlockAttributeMergeStrategy(
				'metadata.noteId',
				'set'
			);

			expect( readMetadata( a ) ).toEqual( { noteId: [ 1 ] } );

			edit( a, { noteId: [ 1, 2 ] } );

			expect( a.yblocks.get( 0 ).get( 'attributes' )?.toJSON() ).toEqual(
				{
					'metadata.noteId#1': 1,
					'metadata.noteId#2': 2,
				}
			);
		} );

		it( 'does not write to the document when nothing changed', () => {
			const a = createPeer();
			edit( a, { name: 'Intro', noteId: [ 2, 1 ] } );
			const stateBefore = Y.encodeStateVector( a.ydoc );

			edit( a, { name: 'Intro', noteId: [ 1, 2 ] } );

			expect( Y.encodeStateVector( a.ydoc ) ).toEqual( stateBefore );
		} );
	} );
} );
