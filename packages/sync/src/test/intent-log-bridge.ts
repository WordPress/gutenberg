/**
 * External dependencies
 */
import { describe, expect, it } from '@jest/globals';

/**
 * Internal dependencies
 */
import {
	blockToEngineSpec,
	deriveIntents,
	engineDocumentToBlocks,
	type BridgeBlock,
} from '../engines/intent-log-bridge';
import {
	createIntentLogSession,
	INTENT_LOG_UPDATE_TYPES,
} from '../engines/intent-log-session';
import {
	createDocument,
	canonicalJson,
} from '../engines/intent-log/document.js';
import {
	createServer,
	serverDocAt,
	serverIngestBatch,
} from '../engines/intent-log/rebase.js';
import type { EngineDocument } from '../engines/intent-log/engine-types';

const paragraph = (
	syncId: string,
	content: string,
	extra: Record< string, unknown > = {}
): BridgeBlock => ( {
	name: 'core/paragraph',
	attributes: { ...extra, content, metadata: { syncId } },
	innerBlocks: [],
} );

function docFromBlocks( blocks: BridgeBlock[] ): EngineDocument {
	return createDocument(
		blocks.map( ( block ) => blockToEngineSpec( block ) )
	);
}

describe( 'intent-log bridge', () => {
	describe( 'block mapping', () => {
		it( 'round-trips blocks with syncId in metadata and content as a field', () => {
			const blocks = [
				paragraph( 'p1', '<p>Hello</p>', { align: 'wide' } ),
				{
					name: 'core/group',
					attributes: { metadata: { syncId: 'g1', name: 'Kept' } },
					innerBlocks: [ paragraph( 'p2', '<p>Nested</p>' ) ],
				},
			];
			const doc = docFromBlocks( blocks );
			expect( doc.root[ 0 ].syncId ).toBe( 'p1' );
			expect( doc.root[ 0 ].fields.content.text ).toBe( '<p>Hello</p>' );
			expect( doc.root[ 0 ].attrs.align ).toBe( 'wide' );
			expect( doc.root[ 0 ].attrs.metadata ).toBeUndefined();
			expect( doc.root[ 1 ].attrs.metadata ).toEqual( { name: 'Kept' } );

			const back = engineDocumentToBlocks( doc );
			expect( back[ 0 ].attributes.metadata ).toEqual( {
				syncId: 'p1',
			} );
			expect( back[ 0 ].attributes.content ).toBe( '<p>Hello</p>' );
			expect( back[ 1 ].attributes.metadata ).toEqual( {
				syncId: 'g1',
				name: 'Kept',
			} );
			expect( back[ 1 ].innerBlocks[ 0 ].attributes.metadata ).toEqual( {
				syncId: 'p2',
			} );
		} );

		it( 'serializes rich-text values and mints ids for new blocks', () => {
			const spec = blockToEngineSpec( {
				name: 'core/paragraph',
				attributes: {
					content: { toHTMLString: () => '<p>Rich</p>' },
				},
				innerBlocks: [],
			} );
			expect( spec.text ).toBe( '<p>Rich</p>' );
			expect( typeof spec.syncId ).toBe( 'string' );
			expect( ( spec.syncId as string ).length ).toBeGreaterThan( 8 );
		} );
	} );

	describe( 'deriveIntents', () => {
		it( 'returns null when nothing changed', () => {
			const blocks = [ paragraph( 'p1', 'Hello' ) ];
			expect(
				deriveIntents( docFromBlocks( blocks ), blocks )
			).toBeNull();
		} );

		it( 'derives a single text intent from an edit', () => {
			const doc = docFromBlocks( [ paragraph( 'p1', 'Hello world' ) ] );
			const derived = deriveIntents( doc, [
				paragraph( 'p1', 'Hello brave world' ),
			] )!;
			expect( derived.coarseBlockCount ).toBe( 0 );
			expect( derived.intents ).toEqual( [
				{
					type: 'insert_text',
					payload: {
						syncId: 'p1',
						field: 'content',
						offset: 6,
						text: 'brave ',
					},
				},
			] );
		} );

		it( 'derives attr set/remove with observed versions from the document', () => {
			const doc = docFromBlocks( [
				paragraph( 'p1', 'Hi', { align: 'wide', dropCap: true } ),
			] );
			// Simulate a prior remote write bumping the register.
			doc.root[ 0 ].attrVersions.align = 3;
			const derived = deriveIntents( doc, [
				paragraph( 'p1', 'Hi', { align: 'full' } ),
			] )!;
			expect( derived.intents ).toEqual(
				expect.arrayContaining( [
					{
						type: 'set_attr',
						payload: {
							syncId: 'p1',
							key: 'align',
							value: 'full',
							observedVersion: 3,
						},
					},
					{
						type: 'remove_attr',
						payload: {
							syncId: 'p1',
							key: 'dropCap',
							observedVersion: 0,
						},
					},
				] )
			);
			expect( derived.coarseBlockCount ).toBe( 0 );
		} );

		it( 'derives insert_block with anchors, one intent per new subtree', () => {
			const doc = docFromBlocks( [ paragraph( 'p1', 'First' ) ] );
			const derived = deriveIntents( doc, [
				paragraph( 'p1', 'First' ),
				{
					name: 'core/group',
					attributes: {},
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: { content: 'Inside' },
							innerBlocks: [],
						},
					],
				},
			] )!;
			expect( derived.intents ).toHaveLength( 1 );
			expect( derived.intents[ 0 ].type ).toBe( 'insert_block' );
			expect( derived.intents[ 0 ].payload.parentId ).toBeNull();
			expect( derived.intents[ 0 ].payload.afterSiblingId ).toBe( 'p1' );
			const block = derived.intents[ 0 ].payload.block as {
				children: unknown[];
			};
			expect( block.children ).toHaveLength( 1 );
			expect( derived.coarseBlockCount ).toBe( 0 );
		} );

		it( 'derives a move (not remove+insert) for a reorder', () => {
			const doc = docFromBlocks( [
				paragraph( 'p1', 'A' ),
				paragraph( 'p2', 'B' ),
				paragraph( 'p3', 'C' ),
			] );
			const derived = deriveIntents( doc, [
				paragraph( 'p3', 'C' ),
				paragraph( 'p1', 'A' ),
				paragraph( 'p2', 'B' ),
			] )!;
			const types = derived.intents.map( ( intent ) => intent.type );
			expect( types ).not.toContain( 'remove_block' );
			expect( types ).not.toContain( 'insert_block' );
			expect( types ).toContain( 'move_block' );
			expect( derived.coarseBlockCount ).toBe( 0 );
		} );

		it( 'derives remove_block and transform_block', () => {
			const doc = docFromBlocks( [
				paragraph( 'p1', 'A' ),
				paragraph( 'p2', 'B' ),
			] );
			const derived = deriveIntents( doc, [
				{
					...paragraph( 'p1', 'A' ),
					name: 'core/heading',
				},
			] )!;
			expect( derived.intents ).toEqual(
				expect.arrayContaining( [
					{ type: 'remove_block', payload: { syncId: 'p2' } },
					{
						type: 'transform_block',
						payload: { syncId: 'p1', newBlockType: 'core/heading' },
					},
				] )
			);
			expect( derived.coarseBlockCount ).toBe( 0 );
		} );

		it( 'verifies combined edits (structure + attrs + text in one batch)', () => {
			const doc = docFromBlocks( [
				paragraph( 'p1', 'Alpha' ),
				paragraph( 'p2', 'Beta' ),
				paragraph( 'p3', 'Gamma' ),
			] );
			const derived = deriveIntents( doc, [
				paragraph( 'p2', 'Beta amended', { align: 'wide' } ),
				paragraph( 'p1', 'Alpha' ),
				paragraph( 'new-block', 'Fresh' ),
			] )!;
			expect( derived.coarseBlockCount ).toBe( 0 );
			expect( derived.intents.length ).toBeGreaterThanOrEqual( 4 );
		} );

		it( 'fails loudly on duplicate syncIds instead of diverging silently', () => {
			const doc = docFromBlocks( [ paragraph( 'p1', 'A' ) ] );
			expect( () =>
				deriveIntents( doc, [
					paragraph( 'p1', 'A' ),
					paragraph( 'p1', 'A copy' ),
				] )
			).toThrow( 'verification' );
		} );
	} );

	describe( 'end to end through a session', () => {
		it( 'derived intents are valid vocabulary and converge two sessions', () => {
			const genesisBlocks = [
				paragraph( 'p1', 'Hello world' ),
				paragraph( 'p2', 'Second' ),
			];
			const initialDoc = docFromBlocks( genesisBlocks );
			const server = createServer( initialDoc );
			const snapshotRow = {
				data: JSON.stringify( { doc: initialDoc } ),
				type: INTENT_LOG_UPDATE_TYPES.SNAPSHOT,
			};

			const alice = createIntentLogSession( { userId: 1, clientId: 11 } );
			const bob = createIntentLogSession( { userId: 2, clientId: 22 } );
			alice.receiveUpdate( snapshotRow );
			bob.receiveUpdate( snapshotRow );

			// Alice's editor produces a new tree: edited text, new block,
			// reorder. The bridge derives intents; the session validates and
			// authors each one (createIntent throws on vocabulary errors).
			const derived = deriveIntents( alice.getDocument()!, [
				paragraph( 'p2', 'Second, edited' ),
				paragraph( 'p1', 'Hello brave world' ),
				{
					name: 'core/quote',
					attributes: { content: 'New quote' },
					innerBlocks: [],
				},
			] )!;
			expect( derived.coarseBlockCount ).toBe( 0 );
			const sent = derived.intents.map( ( intent ) =>
				alice.author( intent.type, intent.payload )
			);

			// Wire round trip: server plans, both sessions receive rows.
			const dispositions = serverIngestBatch( server, sent );
			expect(
				dispositions.every( ( d ) => 'applied' === d.status )
			).toBe( true );
			for ( const entry of server.log ) {
				const row = {
					data: JSON.stringify( entry ),
					type: INTENT_LOG_UPDATE_TYPES.INTENT,
				};
				alice.receiveUpdate( row );
				bob.receiveUpdate( row );
			}

			const serverJson = canonicalJson(
				serverDocAt( server, server.log.length )
			);
			expect( canonicalJson( alice.getDocument()! ) ).toBe( serverJson );
			expect( canonicalJson( bob.getDocument()! ) ).toBe( serverJson );

			// And the converged document maps back to editor blocks.
			const back = engineDocumentToBlocks( bob.getDocument()! );
			expect( back.map( ( block ) => block.attributes.content ) ).toEqual(
				[ 'Second, edited', 'Hello brave world', 'New quote' ]
			);
		} );
	} );
} );
