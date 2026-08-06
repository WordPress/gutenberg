/**
 * External dependencies
 */
import { describe, expect, it } from '@jest/globals';

/**
 * Internal dependencies
 */
import {
	createIntentLogSession,
	INTENT_LOG_UPDATE_TYPES,
	type IntentLogSession,
} from '../engines/intent-log-session';
import type { EngineUpdate } from '../engines/session';
// The engine core is the same code the deterministic simulator validates;
// its in-memory server is the vector-pinned twin of WP_Intent_Log_Engine.
import {
	createServer,
	serverDocAt,
	serverIngestBatch,
} from '../engines/intent-log/rebase.js';
import {
	canonicalJson,
	createDocument,
} from '../engines/intent-log/document.js';

const GENESIS_BLOCKS = [
	{ syncId: 'p1', blockType: 'core/paragraph', text: 'Hello world' },
	{
		syncId: 'q1',
		blockType: 'core/quote',
		fields: {
			content: { text: 'To be or not to be' },
			citation: { text: 'Shakespeare' },
		},
	},
];

/**
 * A wire-level stand-in for WP_Intent_Log_Engine: rows in storage order
 * (snapshot first), planner-backed ingest, dispositions as the ack. Mirrors
 * the PHP engine's commit rules (accepted → intent rows, escalations →
 * proposal rows, voided → marker rows).
 */
function makeWireServer() {
	const initialDoc = createDocument( GENESIS_BLOCKS );
	const server = createServer( initialDoc );
	const rows: EngineUpdate[] = [
		{
			data: JSON.stringify( { doc: initialDoc } ),
			type: INTENT_LOG_UPDATE_TYPES.SNAPSHOT,
		},
	];

	return {
		ingest( sent: EngineUpdate[] ) {
			const intents = sent.map( ( update ) => JSON.parse( update.data ) );
			const logBefore = server.log.length;
			const proposalsBefore = server.proposals.length;
			const results = serverIngestBatch( server, intents );
			for ( const entry of server.log.slice( logBefore ) ) {
				rows.push( {
					data: JSON.stringify( entry ),
					type: INTENT_LOG_UPDATE_TYPES.INTENT,
				} );
			}
			for ( const proposal of server.proposals.slice(
				proposalsBefore
			) ) {
				rows.push( {
					data: JSON.stringify( proposal ),
					type: INTENT_LOG_UPDATE_TYPES.PROPOSAL,
				} );
			}
			const dispositions = intents.map(
				( intent: { intentId: string }, index: number ) => ( {
					intentId: intent.intentId,
					...results[ index ],
				} )
			);
			for ( const disposition of dispositions ) {
				if ( 'voided' === disposition.status ) {
					rows.push( {
						data: JSON.stringify( {
							intentId: disposition.intentId,
							reason: disposition.reason,
						} ),
						type: INTENT_LOG_UPDATE_TYPES.VOIDED,
					} );
				}
			}
			return dispositions;
		},
		rowsAfter: ( cursor: number ) => rows.slice( cursor ),
		rowCount: () => rows.length,
		doc: () => serverDocAt( server, server.log.length ),
	};
}

/**
 * Connects a session to the wire server the way the polling transport does:
 * queued local updates are sent with each poll; the response's rows are
 * processed first, then the dispositions ack (the transport-guaranteed
 * ordering).
 *
 * @param wire    Wire server.
 * @param session Session under test.
 */
function connect(
	wire: ReturnType< typeof makeWireServer >,
	session: IntentLogSession
) {
	const queue: EngineUpdate[] = [];
	session.onLocalUpdate( ( update ) => queue.push( update ) );

	return {
		poll() {
			const sent = queue.splice( 0 );
			const dispositions = sent.length ? wire.ingest( sent ) : null;
			const updates = wire.rowsAfter( this.cursor );
			this.cursor = wire.rowCount();
			for ( const update of updates ) {
				session.receiveUpdate( update );
			}
			if ( dispositions && session.receiveDispositions ) {
				session.receiveDispositions( dispositions );
			}
			return dispositions;
		},
		cursor: 0,
	};
}

function makeSession( userId: number, clientId: number ) {
	return createIntentLogSession( { userId, clientId } );
}

describe( 'intent-log session codec', () => {
	it( 'bootstraps from the snapshot row and ignores duplicate snapshots', () => {
		const session = makeSession( 1, 11 );
		expect( session.isInitialized() ).toBe( false );
		expect( () =>
			session.author( 'insert_text', {
				syncId: 'p1',
				offset: 0,
				text: 'x',
			} )
		).toThrow( 'snapshot' );

		const snapshot = {
			data: JSON.stringify( { doc: createDocument( GENESIS_BLOCKS ) } ),
			type: INTENT_LOG_UPDATE_TYPES.SNAPSHOT,
		};
		session.receiveUpdate( snapshot );
		expect( session.isInitialized() ).toBe( true );
		const before = canonicalJson( session.getDocument()! );

		// A concurrent-initializer duplicate (different content) is ignored.
		session.receiveUpdate( {
			data: JSON.stringify( { doc: createDocument( [] ) } ),
			type: INTENT_LOG_UPDATE_TYPES.SNAPSHOT,
		} );
		expect( canonicalJson( session.getDocument()! ) ).toBe( before );
	} );

	it( 'a checkpoint snapshot past the cursor RESETS the replica (horizon reset), dropping pending intents', () => {
		const session = makeSession( 1, 11 );
		session.receiveUpdate( {
			data: JSON.stringify( { doc: createDocument( GENESIS_BLOCKS ) } ),
			type: INTENT_LOG_UPDATE_TYPES.SNAPSHOT,
		} );
		let resets = 0;
		session.onReset( () => resets++ );

		// Pending local work exists when the reset arrives.
		session.author( 'insert_text', {
			syncId: 'p1',
			offset: 0,
			text: 'pending',
		} );
		expect( session.getPendingCount() ).toBe( 1 );

		const checkpointDoc = createDocument( [
			{
				syncId: 'p9',
				blockType: 'core/paragraph',
				text: 'After compaction',
			},
		] );
		session.receiveUpdate( {
			data: JSON.stringify( { doc: checkpointDoc, seq: 40 } ),
			type: INTENT_LOG_UPDATE_TYPES.SNAPSHOT,
		} );

		expect( resets ).toBe( 1 );
		expect( session.getSeq() ).toBe( 40 );
		expect( session.getPendingCount() ).toBe( 0 );
		expect( canonicalJson( session.getDocument()! ) ).toBe(
			canonicalJson( checkpointDoc )
		);

		// A STALE snapshot (seq at/below cursor) never resets.
		session.receiveUpdate( {
			data: JSON.stringify( {
				doc: createDocument( GENESIS_BLOCKS ),
				seq: 40,
			} ),
			type: INTENT_LOG_UPDATE_TYPES.SNAPSHOT,
		} );
		expect( resets ).toBe( 1 );
		expect( canonicalJson( session.getDocument()! ) ).toBe(
			canonicalJson( checkpointDoc )
		);
	} );

	it( 'authors optimistically and emits wire updates with byte sizes', () => {
		const wire = makeWireServer();
		const session = makeSession( 1, 11 );
		const emitted: Array< { update: EngineUpdate; size: number } > = [];
		session.onLocalUpdate( ( update, size ) =>
			emitted.push( { update, size } )
		);
		session.receiveUpdate( wire.rowsAfter( 0 )[ 0 ] );

		const intent = session.author( 'insert_text', {
			syncId: 'p1',
			offset: 5,
			text: '!',
		} );

		expect( intent.actorId ).toBe( 'u1c11' );
		expect( intent.payload.field ).toBe( 'content' );
		expect( session.getPendingCount() ).toBe( 1 );
		expect( emitted ).toHaveLength( 1 );
		expect( emitted[ 0 ].update.type ).toBe( 'intent' );
		expect( emitted[ 0 ].size ).toBe(
			new TextEncoder().encode( emitted[ 0 ].update.data ).length
		);
		// Optimistic apply is visible immediately.
		expect( session.getDocument()!.root[ 0 ].fields.content.text ).toBe(
			'Hello! world'
		);
	} );

	it( 'converges two sessions through the wire server, transformed own intents included', () => {
		const wire = makeWireServer();
		const alice = makeSession( 1, 11 );
		const bob = makeSession( 2, 22 );
		const aliceLink = connect( wire, alice );
		const bobLink = connect( wire, bob );
		aliceLink.poll();
		bobLink.poll();

		// Alice's insert is accepted first; Bob authors at the same base
		// offset — his accepted form must come back TRANSFORMED (shifted).
		alice.author( 'insert_text', {
			syncId: 'p1',
			offset: 0,
			text: 'AA',
		} );
		aliceLink.poll();
		bob.author( 'insert_text', {
			syncId: 'p1',
			offset: 5,
			text: 'B',
		} );
		const dispositions = bobLink.poll()!;
		aliceLink.poll();

		expect( dispositions[ 0 ].status ).toBe( 'applied' );
		expect( bob.getPendingCount() ).toBe( 0 );
		const serverJson = canonicalJson( wire.doc() );
		expect( canonicalJson( alice.getDocument()! ) ).toBe( serverJson );
		expect( canonicalJson( bob.getDocument()! ) ).toBe( serverJson );
		expect( wire.doc().root[ 0 ].fields.content.text ).toBe(
			'AAHelloB world'
		);
	} );

	it( 'escalates a register conflict into a proposal on every session and stays converged', () => {
		const wire = makeWireServer();
		const alice = makeSession( 1, 11 );
		const bob = makeSession( 2, 22 );
		const aliceLink = connect( wire, alice );
		const bobLink = connect( wire, bob );
		aliceLink.poll();
		bobLink.poll();

		const bobProposals: unknown[] = [];
		bob.onProposal( ( proposal ) => bobProposals.push( proposal ) );

		alice.author( 'set_attr', {
			syncId: 'p1',
			key: 'align',
			value: 'wide',
			observedVersion: 0,
		} );
		aliceLink.poll();

		// Bob writes the same register from the same base, unaware.
		bob.author( 'set_attr', {
			syncId: 'p1',
			key: 'align',
			value: 'full',
			observedVersion: 0,
		} );
		const settled: unknown[] = [];
		bob.onDisposition( ( disposition ) => settled.push( disposition ) );
		const dispositions = bobLink.poll()!;
		aliceLink.poll();

		expect( dispositions[ 0 ] ).toMatchObject( {
			status: 'escalated',
			reason: 'attr-conflict',
		} );
		expect( settled ).toHaveLength( 1 );
		expect( bob.getPendingCount() ).toBe( 0 );
		expect( bobProposals ).toHaveLength( 1 );
		expect( bob.getProposals()[ 0 ].reason ).toBe( 'attr-conflict' );
		// The escalated write is parked, not applied anywhere.
		const serverJson = canonicalJson( wire.doc() );
		expect( canonicalJson( bob.getDocument()! ) ).toBe( serverJson );
		expect( canonicalJson( alice.getDocument()! ) ).toBe( serverJson );
		expect( wire.doc().root[ 0 ].attrs.align ).toBe( 'wide' );
	} );

	it( 'settles a voided intent through its marker row', () => {
		const wire = makeWireServer();
		const alice = makeSession( 1, 11 );
		const bob = makeSession( 2, 22 );
		const aliceLink = connect( wire, alice );
		const bobLink = connect( wire, bob );
		aliceLink.poll();
		bobLink.poll();

		alice.author( 'remove_block', { syncId: 'p1' } );
		aliceLink.poll();
		bob.author( 'remove_block', { syncId: 'p1' } );
		const dispositions = bobLink.poll()!;

		expect( dispositions[ 0 ] ).toMatchObject( {
			status: 'voided',
			reason: 'already-removed',
		} );
		expect( bob.getPendingCount() ).toBe( 0 );
		expect( canonicalJson( bob.getDocument()! ) ).toBe(
			canonicalJson( wire.doc() )
		);
	} );

	it( 'field-scoped concurrency: different fields of one block merge cleanly end to end', () => {
		const wire = makeWireServer();
		const alice = makeSession( 1, 11 );
		const bob = makeSession( 2, 22 );
		const aliceLink = connect( wire, alice );
		const bobLink = connect( wire, bob );
		aliceLink.poll();
		bobLink.poll();

		alice.author( 'insert_text', {
			syncId: 'q1',
			field: 'content',
			offset: 0,
			text: 'Q: ',
		} );
		aliceLink.poll();
		bob.author( 'insert_text', {
			syncId: 'q1',
			field: 'citation',
			offset: 0,
			text: 'Wm. ',
		} );
		const dispositions = bobLink.poll()!;
		aliceLink.poll();

		expect( dispositions[ 0 ].status ).toBe( 'applied' );
		const doc = wire.doc();
		expect( doc.root[ 1 ].fields.content.text ).toBe(
			'Q: To be or not to be'
		);
		expect( doc.root[ 1 ].fields.citation.text ).toBe( 'Wm. Shakespeare' );
		expect( canonicalJson( alice.getDocument()! ) ).toBe(
			canonicalJson( doc )
		);
		expect( canonicalJson( bob.getDocument()! ) ).toBe(
			canonicalJson( doc )
		);
	} );

	it( 'implements the codec edges: no announcements, no client-side compaction, awareness passthrough', () => {
		const session = makeSession( 1, 11 );
		expect( session.getInitialUpdates() ).toEqual( [] );
		expect( () => session.createCompactionUpdate() ).toThrow( 'compact' );
		expect( () => session.createCompactionFromUpdates( [] ) ).toThrow(
			'compact'
		);

		session.setLocalAwareness( { user: 'alice' } );
		expect( session.getLocalAwareness() ).toEqual( { user: 'alice' } );
		session.applyRemoteAwareness( { 22: { user: 'bob' } } );
		expect( session.getPeers() ).toEqual( { 22: { user: 'bob' } } );
	} );
} );
