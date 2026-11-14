import { describe, expect, it, vi } from 'vitest';
import { Y } from '@wordpress/sync';
import {
	collapseUniqueLists,
	expandUniqueLists,
	findUniqueLists,
} from '../crdt-unique-lists';
import {
	deserializeBlockAttributes,
	mergeCrdtBlocks,
	type Block,
	type YBlocks,
} from '../crdt-blocks';

// Attribute definitions of the block types used in the tests.
const BLOCK_ATTRIBUTES = {
	// Note IDs are a list of unique numbers inside the `metadata` attribute.
	'core/paragraph': {
		content: { type: 'rich-text' },
		metadata: {
			type: 'object',
			properties: {
				noteId: {
					type: 'array',
					items: { type: 'number' },
					uniqueItems: true,
				},
			},
		},
	},
	// Tags are a list of unique strings in an attribute of their own.
	'core/test-tags': {
		tags: {
			type: 'array',
			items: { type: 'string' },
			default: [],
			uniqueItems: true,
		},
	},
};

vi.mock( import( '@wordpress/blocks' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	getBlockTypes: ( () =>
		Object.entries( BLOCK_ATTRIBUTES ).map( ( [ name, attributes ] ) => ( {
			name,
			attributes,
		} ) ) ) as any,
} ) );

const noteLists = findUniqueLists( BLOCK_ATTRIBUTES[ 'core/paragraph' ] );
const tagLists = findUniqueLists( BLOCK_ATTRIBUTES[ 'core/test-tags' ] );

type BlockName = keyof typeof BLOCK_ATTRIBUTES;

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
 * Create a collaborator who starts from the document of another one.
 *
 * @param peer Collaborator to copy the document from.
 */
function join( peer: Peer ): Peer {
	return createPeer( Y.encodeStateAsUpdate( peer.ydoc ) );
}

/**
 * Write the block a collaborator's editor holds to that collaborator's
 * document.
 *
 * @param peer       Collaborator who made the change.
 * @param attributes The attributes of the block after the change.
 * @param name       The name of the block.
 */
function edit(
	peer: Peer,
	attributes: Block[ 'attributes' ] = {},
	name: BlockName = 'core/paragraph'
): void {
	const block: Block = {
		name,
		clientId: 'block-1',
		attributes,
		innerBlocks: [],
	};

	mergeCrdtBlocks( peer.yblocks, [ block ], null );
}

/**
 * Read the attributes of the block the way a collaborator's editor receives
 * them.
 *
 * @param peer Collaborator to read from.
 */
function read( peer: Peer ): Block[ 'attributes' ] {
	const blocks = deserializeBlockAttributes( peer.yblocks.toJSON() );

	return blocks[ 0 ].attributes;
}

/**
 * Read the attributes of the block as the shared document stores them.
 *
 * @param peer Collaborator to read from.
 */
function readStored( peer: Peer ): unknown {
	return peer.yblocks.get( 0 ).get( 'attributes' )?.toJSON();
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

describe( 'lists of unique items in block attributes', () => {
	describe( 'findUniqueLists', () => {
		it( 'finds a list in an attribute of its own', () => {
			expect( tagLists ).toEqual( [
				{
					path: [ 'tags' ],
					itemKeyPrefix: 'tags#',
					orderKey: 'tags@order',
				},
			] );
		} );

		it( 'finds a list in a property of an object attribute', () => {
			expect( noteLists ).toEqual( [
				{
					path: [ 'metadata', 'noteId' ],
					itemKeyPrefix: 'metadata.noteId#',
					orderKey: 'metadata.noteId@order',
				},
			] );
		} );

		it( 'skips lists that do not declare unique items', () => {
			const attributes = {
				ids: { type: 'array', items: { type: 'number' } },
				metadata: { type: 'object' },
			};

			expect( findUniqueLists( attributes ) ).toEqual( [] );
		} );

		it( 'skips values that are stored as shared types', () => {
			expect(
				findUniqueLists( {
					body: {
						type: 'array',
						uniqueItems: true,
						query: { content: { type: 'rich-text' } },
					},
				} )
			).toEqual( [] );
		} );

		it( 'skips definitions with an unexpected shape', () => {
			const attributes: Record< string, any > = {
				broken: null,
				name: 'title',
				metadata: { type: 'object', properties: 'noteId' },
				ids: { type: 'array', uniqueItems: 'yes' },
			};

			expect( findUniqueLists( attributes ) ).toEqual( [] );
		} );
	} );

	describe( 'expandUniqueLists', () => {
		it( 'moves each item to its own key', () => {
			expect(
				expandUniqueLists(
					{ metadata: { name: 'Intro', noteId: [ 3, 7 ] } },
					noteLists
				)
			).toEqual( {
				metadata: { name: 'Intro' },
				'metadata.noteId#3': 3,
				'metadata.noteId#7': 7,
			} );
		} );

		it( 'removes the attribute when the list was its only property', () => {
			expect(
				expandUniqueLists( { metadata: { noteId: [ 3 ] } }, noteLists )
			).toEqual( { 'metadata.noteId#3': 3 } );
		} );

		it( 'stores the order when it is not the sorted order', () => {
			expect(
				expandUniqueLists(
					{ metadata: { noteId: [ 12, 3 ] } },
					noteLists
				)
			).toEqual( {
				'metadata.noteId#12': 12,
				'metadata.noteId#3': 3,
				'metadata.noteId@order': [ '12', '3' ],
			} );
		} );

		it( 'sorts numbers by value', () => {
			expect(
				expandUniqueLists(
					{ metadata: { noteId: [ 3, 12 ] } },
					noteLists
				)
			).toEqual( {
				'metadata.noteId#3': 3,
				'metadata.noteId#12': 12,
			} );
		} );

		it( 'leaves an empty list alone', () => {
			const attributes = { tags: [] };

			expect( expandUniqueLists( attributes, tagLists ) ).toBe(
				attributes
			);
		} );

		it( 'leaves a single value alone', () => {
			const attributes = { metadata: { noteId: 3 } };

			expect( expandUniqueLists( attributes, noteLists ) ).toBe(
				attributes
			);
		} );

		it( 'leaves a list alone when an item is not a string or number', () => {
			const attributes = { metadata: { noteId: [ 3, { id: 7 } ] } };

			expect( expandUniqueLists( attributes, noteLists ) ).toBe(
				attributes
			);
		} );

		it( 'leaves a list alone when two items are the same', () => {
			const attributes = { metadata: { noteId: [ 3, 7, '3' ] } };

			expect( expandUniqueLists( attributes, noteLists ) ).toBe(
				attributes
			);
		} );

		it( 'leaves attributes without the list alone', () => {
			const attributes = { metadata: { name: 'Intro' }, level: 2 };

			expect( expandUniqueLists( attributes, noteLists ) ).toBe(
				attributes
			);
		} );

		it( 'does not change the attributes it is given', () => {
			const attributes = { metadata: { noteId: [ 3 ] } };
			expandUniqueLists( attributes, noteLists );

			expect( attributes ).toEqual( { metadata: { noteId: [ 3 ] } } );
		} );
	} );

	describe( 'collapseUniqueLists', () => {
		it( 'puts the items back into the attribute, sorted', () => {
			expect(
				collapseUniqueLists(
					{
						metadata: { name: 'Intro' },
						'metadata.noteId#12': 12,
						'metadata.noteId#7': 7,
						'metadata.noteId#3': 3,
					},
					noteLists
				)
			).toEqual( { metadata: { name: 'Intro', noteId: [ 3, 7, 12 ] } } );
		} );

		it( 'creates the attribute when it does not exist', () => {
			expect(
				collapseUniqueLists( { 'metadata.noteId#3': 3 }, noteLists )
			).toEqual( { metadata: { noteId: [ 3 ] } } );
		} );

		it( 'follows the stored order', () => {
			expect(
				collapseUniqueLists(
					{
						'tags#keynote': 'keynote',
						'tags#talk': 'talk',
						'tags@order': [ 'talk', 'keynote' ],
					},
					tagLists
				)
			).toEqual( { tags: [ 'talk', 'keynote' ] } );
		} );

		it( 'puts items that the stored order does not mention last', () => {
			expect(
				collapseUniqueLists(
					{
						'tags#keynote': 'keynote',
						'tags#panel': 'panel',
						'tags#talk': 'talk',
						'tags@order': [ 'talk' ],
					},
					tagLists
				)
			).toEqual( { tags: [ 'talk', 'keynote', 'panel' ] } );
		} );

		it( 'skips removed items that the stored order still mentions', () => {
			expect(
				collapseUniqueLists(
					{
						'tags#keynote': 'keynote',
						'tags@order': [ 'talk', 'keynote', 'talk' ],
					},
					tagLists
				)
			).toEqual( { tags: [ 'keynote' ] } );
		} );

		it( 'removes a stored order that has no items left', () => {
			expect(
				collapseUniqueLists(
					{ tags: [], 'tags@order': [ 'talk', 'keynote' ] },
					tagLists
				)
			).toEqual( { tags: [] } );
		} );

		it( 'keeps items stored inside the attribute by older code', () => {
			expect(
				collapseUniqueLists(
					{
						metadata: { noteId: [ 3 ] },
						'metadata.noteId#7': 7,
					},
					noteLists
				)
			).toEqual( { metadata: { noteId: [ 3, 7 ] } } );
		} );

		it( 'skips values that are not strings or numbers', () => {
			expect(
				collapseUniqueLists(
					{
						'metadata.noteId#3': 3,
						'metadata.noteId#x': { id: 4 },
					},
					noteLists
				)
			).toEqual( { metadata: { noteId: [ 3 ] } } );
		} );

		it( 'leaves attributes without item keys alone', () => {
			const attributes = { metadata: { noteId: 3 } };

			expect( collapseUniqueLists( attributes, noteLists ) ).toBe(
				attributes
			);
		} );

		it( 'restores what expandUniqueLists stored', () => {
			const notes = { metadata: { name: 'Intro', noteId: [ 12, 3 ] } };
			const tags = { tags: [ 'talk', 'keynote', 'panel' ] };

			expect(
				collapseUniqueLists(
					expandUniqueLists( notes, noteLists ),
					noteLists
				)
			).toEqual( notes );
			expect(
				collapseUniqueLists(
					expandUniqueLists( tags, tagLists ),
					tagLists
				)
			).toEqual( tags );
		} );
	} );

	describe( 'in a shared document', () => {
		it( 'keeps both items when collaborators add at the same time', () => {
			const a = createPeer();
			edit( a, { metadata: { name: 'Intro' } } );
			const b = join( a );

			edit( a, { metadata: { name: 'Intro', noteId: [ 1 ] } } );
			edit( b, { metadata: { name: 'Intro', noteId: [ 2 ] } } );
			sync( a, b );

			const expected = { metadata: { name: 'Intro', noteId: [ 1, 2 ] } };
			expect( read( a ) ).toEqual( expected );
			expect( read( b ) ).toEqual( expected );
		} );

		it( 'keeps both items when the block had no attribute yet', () => {
			const a = createPeer();
			edit( a );
			const b = join( a );

			edit( a, { metadata: { noteId: [ 1 ] } } );
			edit( b, { metadata: { noteId: [ 2 ] } } );
			sync( a, b );

			expect( read( a ) ).toEqual( { metadata: { noteId: [ 1, 2 ] } } );
			expect( read( b ) ).toEqual( { metadata: { noteId: [ 1, 2 ] } } );
		} );

		it( 'needs no collaborator online to merge', () => {
			const a = createPeer();
			edit( a );
			const b = join( a );

			// Both collaborators add a note and leave. Only their updates
			// remain, as a sync server would hold them.
			edit( a, { metadata: { noteId: [ 1 ] } } );
			edit( b, { metadata: { noteId: [ 2 ] } } );
			const updates = [
				Y.encodeStateAsUpdate( a.ydoc ),
				Y.encodeStateAsUpdate( b.ydoc ),
			];

			const late = createPeer( Y.mergeUpdates( updates ) );

			expect( read( late ) ).toEqual( {
				metadata: { noteId: [ 1, 2 ] },
			} );
		} );

		it( 'keeps a removal made while another collaborator adds', () => {
			const a = createPeer();
			edit( a, { metadata: { noteId: [ 1, 2 ] } } );
			const b = join( a );

			edit( a, { metadata: { noteId: [ 2 ] } } );
			edit( b, { metadata: { noteId: [ 1, 2, 3 ] } } );
			sync( a, b );

			expect( read( a ) ).toEqual( { metadata: { noteId: [ 2, 3 ] } } );
			expect( read( b ) ).toEqual( { metadata: { noteId: [ 2, 3 ] } } );
		} );

		it( 'keeps a removal made while another collaborator changes the same attribute', () => {
			const a = createPeer();
			edit( a, { metadata: { noteId: [ 1 ] } } );
			const b = join( a );

			edit( a );
			edit( b, { metadata: { name: 'Intro', noteId: [ 1 ] } } );
			sync( a, b );

			expect( read( a ) ).toEqual( { metadata: { name: 'Intro' } } );
			expect( read( b ) ).toEqual( { metadata: { name: 'Intro' } } );
		} );

		it( 'keeps an item added while another collaborator removes the last one', () => {
			const a = createPeer();
			edit( a, { tags: [ 'keynote' ] }, 'core/test-tags' );
			const b = join( a );

			edit( a, { tags: [] }, 'core/test-tags' );
			edit( b, { tags: [ 'keynote', 'talk' ] }, 'core/test-tags' );
			sync( a, b );

			expect( read( a ) ).toEqual( { tags: [ 'talk' ] } );
			expect( read( b ) ).toEqual( { tags: [ 'talk' ] } );
		} );

		it( 'keeps both items when collaborators add out of order at the same time', () => {
			const a = createPeer();
			edit( a, { tags: [ 'talk' ] }, 'core/test-tags' );
			const b = join( a );

			edit( a, { tags: [ 'talk', 'panel' ] }, 'core/test-tags' );
			edit( b, { tags: [ 'talk', 'keynote' ] }, 'core/test-tags' );
			sync( a, b );

			// Both collaborators stored an order, and one of the two wins.
			// The item that the winning order does not mention comes last.
			const tags = read( a ).tags;
			expect( read( b ).tags ).toEqual( tags );
			expect( [
				[ 'talk', 'panel', 'keynote' ],
				[ 'talk', 'keynote', 'panel' ],
			] ).toContainEqual( tags );
		} );

		it( 'keeps an item added while another collaborator changes the order', () => {
			const a = createPeer();
			edit( a, { tags: [ 'keynote', 'panel' ] }, 'core/test-tags' );
			const b = join( a );

			edit( a, { tags: [ 'panel', 'keynote' ] }, 'core/test-tags' );
			edit(
				b,
				{ tags: [ 'keynote', 'panel', 'talk' ] },
				'core/test-tags'
			);
			sync( a, b );

			const expected = { tags: [ 'panel', 'keynote', 'talk' ] };
			expect( read( a ) ).toEqual( expected );
			expect( read( b ) ).toEqual( expected );
		} );

		it( 'keeps a removal made while another collaborator changes the order', () => {
			const a = createPeer();
			edit(
				a,
				{ tags: [ 'keynote', 'panel', 'talk' ] },
				'core/test-tags'
			);
			const b = join( a );

			edit(
				a,
				{ tags: [ 'talk', 'keynote', 'panel' ] },
				'core/test-tags'
			);
			edit( b, { tags: [ 'keynote', 'panel' ] }, 'core/test-tags' );
			sync( a, b );

			expect( read( a ) ).toEqual( { tags: [ 'keynote', 'panel' ] } );
			expect( read( b ) ).toEqual( { tags: [ 'keynote', 'panel' ] } );
		} );

		it( 'keeps one order when collaborators change the order at the same time', () => {
			const a = createPeer();
			edit(
				a,
				{ tags: [ 'keynote', 'panel', 'talk' ] },
				'core/test-tags'
			);
			const b = join( a );

			const orderOfA = [ 'talk', 'keynote', 'panel' ];
			const orderOfB = [ 'panel', 'talk', 'keynote' ];
			edit( a, { tags: orderOfA }, 'core/test-tags' );
			edit( b, { tags: orderOfB }, 'core/test-tags' );
			sync( a, b );

			// Which of the two orders wins is up to the shared document.
			const tags = read( a ).tags;
			expect( read( b ).tags ).toEqual( tags );
			expect( [ orderOfA, orderOfB ] ).toContainEqual( tags );
		} );

		it( 'moves a list stored inside the attribute to its own keys on the next change', () => {
			const a = createPeer();
			edit( a );

			// Written by code that does not know that the note IDs are a list
			// of unique items.
			a.yblocks
				.get( 0 )
				.get( 'attributes' )
				?.set( 'metadata', { noteId: [ 1 ] } );

			expect( read( a ) ).toEqual( { metadata: { noteId: [ 1 ] } } );

			edit( a, { metadata: { noteId: [ 1, 2 ] } } );

			expect( readStored( a ) ).toEqual( {
				'metadata.noteId#1': 1,
				'metadata.noteId#2': 2,
			} );
		} );

		it( 'does not write to the document when nothing changed', () => {
			const a = createPeer();
			edit( a, { metadata: { name: 'Intro', noteId: [ 2, 1 ] } } );
			const stateBefore = Y.encodeStateVector( a.ydoc );

			edit( a, read( a ) );

			expect( Y.encodeStateVector( a.ydoc ) ).toEqual( stateBefore );
		} );
	} );
} );
