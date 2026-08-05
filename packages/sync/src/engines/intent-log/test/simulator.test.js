import assert from 'node:assert/strict';

import { canonicalJson, getBlock } from '../document.js';
import { IntentTypes, createIntent } from '../intents.js';
import { createServer, serverDocAt } from '../rebase.js';
import {
	authorRandomIntent,
	makeClient,
	makeGenesisDoc,
	mulberry32,
	runSimulation,
	syncClient,
} from '../simulator.js';
import { genesisSyncId } from '../sync-id.js';

const REVISION = { postId: 10, revisionId: 100 };

test( 'legacy post: independent genesis minting agrees; concurrent inserts at position 2 both survive', () => {
	// Two clients independently derive identity for a legacy post from the
	// same immutable revision — no coordination.
	const aliceDoc = makeGenesisDoc( REVISION );
	const bobDoc = makeGenesisDoc( REVISION );
	assert.equal( canonicalJson( aliceDoc ), canonicalJson( bobDoc ) );

	const server = createServer( makeGenesisDoc( REVISION ) );
	const alice = makeClient( 'alice', aliceDoc );
	const bob = makeClient( 'bob', bobDoc );
	const anchor = genesisSyncId( REVISION, [ 0 ] );

	// Both insert a new paragraph "at position 2" (after the first block),
	// offline from each other, with creation-minted ids.
	const insertFor = ( client, syncId ) => {
		const intent = createIntent(
			IntentTypes.INSERT_BLOCK,
			{
				block: { syncId, blockType: 'core/paragraph' },
				parentId: null,
				afterSiblingId: anchor,
			},
			{
				actorId: client.actorId,
				baseSeq: client.cursor,
				intentId: `${ client.actorId }-insert`,
			}
		);
		client.outbox.push( intent );
		return intent;
	};
	insertFor( alice, 'alice-new-para' );
	insertFor( bob, 'bob-new-para' );

	syncClient( server, alice );
	syncClient( server, bob );
	syncClient( server, alice );

	const finalDoc = serverDocAt( server, server.log.length );
	assert.ok( getBlock( finalDoc, 'alice-new-para' ) );
	assert.ok( getBlock( finalDoc, 'bob-new-para' ) );
	assert.equal( canonicalJson( alice.baseDoc ), canonicalJson( finalDoc ) );
	assert.equal( canonicalJson( bob.baseDoc ), canonicalJson( finalDoc ) );
} );

test( 'long-offline divergence on disjoint blocks merges with zero escalations', () => {
	const server = createServer( makeGenesisDoc( REVISION ) );
	const online = makeClient( 'online', makeGenesisDoc( REVISION ) );
	const offline = makeClient( 'offline', makeGenesisDoc( REVISION ) );
	const blockA = genesisSyncId( REVISION, [ 0 ] );
	const blockB = genesisSyncId( REVISION, [ 3 ] );

	const edit = ( client, syncId, index ) => {
		const intent = createIntent(
			IntentTypes.INSERT_TEXT,
			{ syncId, offset: 0, text: `${ client.actorId }${ index } ` },
			{
				actorId: client.actorId,
				baseSeq: client.cursor,
				intentId: `${ client.actorId }#${ index }`,
			}
		);
		client.outbox.push( intent );
	};

	// The online client edits block A and syncs continuously; the offline
	// client accumulates 30 edits to block B without syncing once.
	for ( let i = 0; i < 30; i++ ) {
		edit( online, blockA, i );
		syncClient( server, online );
		edit( offline, blockB, i );
	}
	syncClient( server, offline );
	syncClient( server, online );

	const statuses = [ ...server.dispositions.values() ].map(
		( d ) => d.status
	);
	assert.equal(
		statuses.filter( ( s ) => s === 'escalated' ).length,
		0,
		'disjoint-block edits must never escalate'
	);
	assert.equal( statuses.filter( ( s ) => s === 'applied' ).length, 60 );
	const finalDoc = serverDocAt( server, server.log.length );
	assert.equal( canonicalJson( offline.baseDoc ), canonicalJson( finalDoc ) );
	assert.equal( canonicalJson( online.baseDoc ), canonicalJson( finalDoc ) );
	assert.ok(
		getBlock( finalDoc, blockB ).fields.content.text.startsWith(
			'offline29'
		)
	);
} );

test( 'deep divergence on the same block escalates conflicts without losing work', () => {
	const server = createServer( makeGenesisDoc( REVISION ) );
	const alice = makeClient( 'alice', makeGenesisDoc( REVISION ) );
	const bob = makeClient( 'bob', makeGenesisDoc( REVISION ) );
	const target = genesisSyncId( REVISION, [ 1 ] );
	const elsewhere = genesisSyncId( REVISION, [ 3 ] );

	// Alice replaces a range and syncs; Bob, offline, deletes an
	// overlapping range in the same block, then keeps editing: once in the
	// conflicted block (its coordinates depend on the escalated delete),
	// once in an untouched block.
	const aliceIntent = createIntent(
		IntentTypes.REPLACE_TEXT,
		{
			syncId: target,
			start: 4,
			end: 8,
			removedText: 'rain',
			text: 'snow',
		},
		{ actorId: 'alice', baseSeq: 0, intentId: 'alice#0' }
	);
	alice.outbox.push( aliceIntent );
	syncClient( server, alice );

	const conflicting = createIntent(
		IntentTypes.DELETE_TEXT,
		{ syncId: target, start: 0, end: 8, removedText: 'The rain' },
		{ actorId: 'bob', baseSeq: 0, intentId: 'bob#0' }
	);
	const dependent = createIntent(
		IntentTypes.INSERT_TEXT,
		{ syncId: target, offset: 18, text: ' Heavily.' },
		{ actorId: 'bob', baseSeq: 0, intentId: 'bob#1' }
	);
	const safe = createIntent(
		IntentTypes.INSERT_TEXT,
		{ syncId: elsewhere, offset: 0, text: 'Then: ' },
		{ actorId: 'bob', baseSeq: 0, intentId: 'bob#2' }
	);
	bob.outbox.push( conflicting, dependent, safe );
	syncClient( server, bob );

	assert.equal( server.dispositions.get( 'bob#0' ).status, 'escalated' );
	// bob#1 was authored on local state that included the escalated delete;
	// its offsets are meaningless in the server frame, so it follows the
	// delete into review instead of landing at a wrong position.
	assert.deepEqual( server.dispositions.get( 'bob#1' ), {
		status: 'escalated',
		reason: 'dependent-on-escalated',
	} );
	assert.equal( server.dispositions.get( 'bob#2' ).status, 'applied' );
	assert.equal( server.proposals.length, 2 );
	assert.ok(
		server.proposals.every( ( proposal ) => proposal.actorId === 'bob' )
	);
	const finalDoc = serverDocAt( server, server.log.length );
	assert.ok(
		getBlock( finalDoc, target ).fields.content.text.includes( 'snow' )
	);
	assert.ok(
		getBlock( finalDoc, elsewhere ).fields.content.text.startsWith(
			'Then: '
		)
	);
	assert.equal( canonicalJson( bob.baseDoc ), canonicalJson( finalDoc ) );
	// The optimistic replica dropped the escalated work and matches too.
	assert.equal( canonicalJson( bob.doc ), canonicalJson( finalDoc ) );
} );

test( 'randomized schedules uphold every oracle across seeds', () => {
	for ( let seed = 1; seed <= 12; seed++ ) {
		const { violations, authored, server } = runSimulation( {
			seed,
			steps: 150,
			clientCount: 3,
		} );
		assert.deepEqual(
			violations,
			[],
			`seed ${ seed } violated oracles (authored ${ authored.size }, log ${ server.log.length })`
		);
	}
} );

test( 'simulation is exactly reproducible from its seed', () => {
	const first = runSimulation( { seed: 7, steps: 120 } );
	const second = runSimulation( { seed: 7, steps: 120 } );
	assert.equal(
		canonicalJson( first.finalDoc ),
		canonicalJson( second.finalDoc )
	);
	assert.deepEqual(
		[ ...first.server.dispositions.entries() ],
		[ ...second.server.dispositions.entries() ]
	);
	assert.equal(
		first.server.proposals.length,
		second.server.proposals.length
	);
} );

test( 'authorRandomIntent generates only vocabulary-valid intents', () => {
	const rng = mulberry32( 99 );
	const client = makeClient( 'gen', makeGenesisDoc( REVISION ) );
	for ( let i = 0; i < 200; i++ ) {
		// createIntent validates; a malformed generator throws here.
		authorRandomIntent( client, rng );
	}
	assert.ok( client.outbox.length > 0 );
} );
