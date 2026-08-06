import assert from 'node:assert/strict';

import { canonicalJson, createDocument, getBlock } from '../document.js';
import { IntentTypes, createIntent } from '../intents.js';
import { createServer, serverDocAt, serverIngestBatch } from '../rebase.js';
import {
	authorIntent,
	catchUp,
	clientReceive,
	createClient,
	flushClient,
	predictedDisposition,
} from '../client.js';

const baseDoc = () =>
	createDocument( [
		{ syncId: 'p1', blockType: 'core/paragraph', text: 'Hello world' },
		{
			syncId: 'g1',
			blockType: 'core/group',
			children: [
				{ syncId: 'p2', blockType: 'core/paragraph', text: 'Nested' },
			],
		},
		{ syncId: 'p3', blockType: 'core/paragraph', text: 'Tail' },
	] );

const headDoc = ( server ) => serverDocAt( server, server.log.length );

function makeActorClient( actorId ) {
	const client = createClient( actorId, baseDoc() );
	const author = ( type, payload, extra = {} ) => {
		const intent = createIntent( type, payload, {
			actorId,
			baseSeq: client.cursor,
			intentId: `${ actorId }#${ client.nextIntent++ }`,
			...extra,
		} );
		authorIntent( client, intent );
		return intent;
	};
	return { client, author };
}

function assertReportExact( report ) {
	for ( const row of report ) {
		assert.deepEqual(
			row.predicted,
			row.actual,
			`${ row.intentId }: prediction diverged from server disposition`
		);
	}
}

test( 'flush converges the optimistic replica with the server head', () => {
	const server = createServer( baseDoc() );
	const { client, author } = makeActorClient( 'alice' );
	author( IntentTypes.INSERT_TEXT, { syncId: 'p1', offset: 5, text: '!' } );
	author( IntentTypes.SET_ATTR, {
		syncId: 'p3',
		key: 'align',
		value: 'wide',
		observedVersion: 0,
	} );
	const report = flushClient( server, client );
	assertReportExact( report );
	assert.equal(
		canonicalJson( client.doc ),
		canonicalJson( headDoc( server ) )
	);
	assert.equal(
		canonicalJson( client.baseDoc ),
		canonicalJson( client.doc )
	);
} );

test( 'receive-only catch-up rebases pending work into the optimistic doc', () => {
	const server = createServer( baseDoc() );
	const remote = makeActorClient( 'remote' );
	const local = makeActorClient( 'local' );

	// Local authors against the base; remote's earlier insert lands first.
	local.author( IntentTypes.INSERT_TEXT, {
		syncId: 'p1',
		offset: 11,
		text: '!',
	} );
	remote.author( IntentTypes.INSERT_TEXT, {
		syncId: 'p1',
		offset: 0,
		text: 'R: ',
	} );
	flushClient( server, remote.client );

	// Catch up WITHOUT flushing: the pending insert must shift right.
	catchUp( server, local.client );
	assert.equal(
		getBlock( local.client.doc, 'p1' ).fields.content.text,
		'R: Hello world!',
		'optimistic doc must hold the rebased pending intent'
	);
	// Acked state has only the remote edit.
	assert.equal(
		getBlock( local.client.baseDoc, 'p1' ).fields.content.text,
		'R: Hello world'
	);

	const report = flushClient( server, local.client );
	assertReportExact( report );
	assert.equal(
		getBlock( headDoc( server ), 'p1' ).fields.content.text,
		'R: Hello world!'
	);
	assert.equal(
		canonicalJson( local.client.doc ),
		canonicalJson( headDoc( server ) )
	);
} );

test( 'REGRESSION: pipelined offline edits with an interleaved remote edit escalate instead of landing misplaced', () => {
	// bob types "AA" at 0, then "B" right after it (local frame). alice's
	// concurrent "z" at 1 is accepted first. A naive one-sided transform of
	// bob's second intent would shift its offset against the WRONG frame and
	// silently interleave the text ("AAHBzello…"). The engine must apply the
	// first intent, escalate the second (frame-conflict), and park it.
	const server = createServer( baseDoc() );
	const alice = makeActorClient( 'alice' );
	const bob = makeActorClient( 'bob' );

	bob.author( IntentTypes.INSERT_TEXT, {
		syncId: 'p1',
		offset: 0,
		text: 'AA',
	} );
	bob.author( IntentTypes.INSERT_TEXT, {
		syncId: 'p1',
		offset: 2,
		text: 'B',
	} );
	assert.equal(
		getBlock( bob.client.doc, 'p1' ).fields.content.text,
		'AABHello world'
	);

	alice.author( IntentTypes.INSERT_TEXT, {
		syncId: 'p1',
		offset: 1,
		text: 'z',
	} );
	flushClient( server, alice.client );

	const report = flushClient( server, bob.client );
	assertReportExact( report );
	assert.deepEqual( report[ 0 ].actual, { status: 'applied' } );
	assert.deepEqual( report[ 1 ].actual, {
		status: 'escalated',
		reason: 'frame-conflict',
	} );

	const text = getBlock( headDoc( server ), 'p1' ).fields.content.text;
	assert.equal( text, 'AAHzello world', 'no silently misplaced insert' );
	assert.ok(
		! text.includes( 'B' ),
		'the conflicted insert is parked, not misplaced'
	);
	assert.equal( server.proposals.length, 1 );
	assert.equal( server.proposals[ 0 ].actorId, 'bob' );
	assert.equal(
		canonicalJson( bob.client.doc ),
		canonicalJson( headDoc( server ) )
	);
} );

test( 'pipelined offline edits with NO remote interference apply as authored', () => {
	const server = createServer( baseDoc() );
	const bob = makeActorClient( 'bob' );
	bob.author( IntentTypes.INSERT_TEXT, {
		syncId: 'p1',
		offset: 0,
		text: 'AA',
	} );
	bob.author( IntentTypes.INSERT_TEXT, {
		syncId: 'p1',
		offset: 2,
		text: 'B',
	} );
	const report = flushClient( server, bob.client );
	assertReportExact( report );
	assert.deepEqual(
		report.map( ( row ) => row.actual ),
		[ { status: 'applied' }, { status: 'applied' } ]
	);
	assert.equal(
		getBlock( headDoc( server ), 'p1' ).fields.content.text,
		'AABHello world'
	);
} );

test( 'an intent authored AFTER observing the conflicting entry is clean (baseSeq scoping)', () => {
	const server = createServer( baseDoc() );
	const alice = makeActorClient( 'alice' );
	const bob = makeActorClient( 'bob' );

	// bob's offline delete will conflict with alice's overlapping replace.
	bob.author( IntentTypes.DELETE_TEXT, {
		syncId: 'p1',
		start: 0,
		end: 8,
		removedText: 'Hello wo',
	} );
	alice.author( IntentTypes.REPLACE_TEXT, {
		syncId: 'p1',
		start: 4,
		end: 8,
		removedText: 'o wo',
		text: 'XXXX',
	} );
	flushClient( server, alice.client );

	// bob observes the conflict (catch-up settles his delete), then keeps
	// editing the same block: the new intent is authored on a frame WITHOUT
	// the dropped delete, so it must apply cleanly.
	catchUp( server, bob.client );
	assert.equal(
		predictedDisposition( bob.client, 'bob#0' ).status,
		'escalated'
	);
	assert.equal(
		getBlock( bob.client.doc, 'p1' ).fields.content.text,
		'HellXXXXrld'
	);
	bob.author( IntentTypes.INSERT_TEXT, {
		syncId: 'p1',
		offset: 0,
		text: '>',
	} );

	const report = flushClient( server, bob.client );
	assertReportExact( report );
	assert.deepEqual( report[ 1 ].actual, { status: 'applied' } );
	assert.equal(
		getBlock( headDoc( server ), 'p1' ).fields.content.text,
		'>HellXXXXrld'
	);
} );

test( 'escalated pending work leaves the optimistic doc but still reaches the proposal lane', () => {
	const server = createServer( baseDoc() );
	const agentClient = makeActorClient( 'agent' );
	const bob = makeActorClient( 'bob' );

	bob.author( IntentTypes.INSERT_TEXT, {
		syncId: 'p2',
		offset: 6,
		text: '?',
	} );
	agentClient.author( IntentTypes.REPLACE_ATTR_CONTENT, {
		syncId: 'p2',
		newText: 'Rewritten.',
		observedVersion: 0,
	} );
	flushClient( server, agentClient.client );

	catchUp( server, bob.client );
	// The optimistic doc adopts the rewrite and drops the parked insert.
	assert.equal(
		getBlock( bob.client.doc, 'p2' ).fields.content.text,
		'Rewritten.'
	);
	const report = flushClient( server, bob.client );
	assertReportExact( report );
	assert.deepEqual( report[ 0 ].actual, {
		status: 'escalated',
		reason: 'content-replaced',
	} );
	assert.equal( server.proposals.length, 1 );
	assert.equal( server.proposals[ 0 ].actorId, 'bob' );
	assert.equal( server.proposals[ 0 ].intent.intentId, 'bob#0' );
} );

test( 'txn unit prediction is atomic: one conflicted member parks the pair', () => {
	const server = createServer( baseDoc() );
	const alice = makeActorClient( 'alice' );
	const bob = makeActorClient( 'bob' );

	alice.author( IntentTypes.SET_ATTR, {
		syncId: 'p1',
		key: 'align',
		value: 'wide',
		observedVersion: 0,
	} );
	flushClient( server, alice.client );

	bob.author(
		IntentTypes.INSERT_TEXT,
		{ syncId: 'p3', offset: 0, text: 'safe ' },
		{ txnId: 't1' }
	);
	bob.author(
		IntentTypes.SET_ATTR,
		{ syncId: 'p1', key: 'align', value: 'full', observedVersion: 0 },
		{ txnId: 't1' }
	);

	catchUp( server, bob.client );
	// Prediction knows the whole unit parks; the optimistic doc holds
	// NEITHER member.
	assert.equal(
		predictedDisposition( bob.client, 'bob#0' ).status,
		'escalated'
	);
	assert.equal(
		predictedDisposition( bob.client, 'bob#1' ).status,
		'escalated'
	);
	assert.equal(
		getBlock( bob.client.doc, 'p3' ).fields.content.text,
		'Tail'
	);

	const report = flushClient( server, bob.client );
	assertReportExact( report );
	assert.equal(
		getBlock( headDoc( server ), 'p3' ).fields.content.text,
		'Tail'
	);
	assert.equal( server.proposals.length, 2 );
} );

test( 'prediction covers rebase voids and apply-time voids exactly', () => {
	const server = createServer( baseDoc() );
	const alice = makeActorClient( 'alice' );
	const bob = makeActorClient( 'bob' );

	// alice deletes everything bob's delete covers → rebase void.
	alice.author( IntentTypes.DELETE_TEXT, {
		syncId: 'p1',
		start: 0,
		end: 11,
		removedText: 'Hello world',
	} );
	flushClient( server, alice.client );

	bob.author( IntentTypes.DELETE_TEXT, {
		syncId: 'p1',
		start: 3,
		end: 8,
		removedText: 'lo wo',
	} );
	// bob also re-removes a block alice already removed → void at rebase.
	alice.author( IntentTypes.REMOVE_BLOCK, { syncId: 'p3' } );
	flushClient( server, alice.client );
	bob.author( IntentTypes.REMOVE_BLOCK, { syncId: 'p3' } );

	const report = flushClient( server, bob.client );
	assertReportExact( report );
	assert.deepEqual( report[ 0 ].actual, {
		status: 'voided',
		reason: 'already-deleted',
	} );
	assert.deepEqual( report[ 1 ].actual, {
		status: 'voided',
		reason: 'already-removed',
	} );
	assert.equal(
		canonicalJson( bob.client.doc ),
		canonicalJson( headDoc( server ) )
	);
} );

test( 'many receive-only catch-ups between authoring steps stay exact', () => {
	const server = createServer( baseDoc() );
	const alice = makeActorClient( 'alice' );
	const bob = makeActorClient( 'bob' );

	for ( let i = 0; i < 5; i++ ) {
		alice.author( IntentTypes.INSERT_TEXT, {
			syncId: 'p1',
			offset: 0,
			text: `a${ i } `,
		} );
		flushClient( server, alice.client );
		bob.author( IntentTypes.INSERT_TEXT, {
			syncId: 'p3',
			offset: getBlock( bob.client.doc, 'p3' ).fields.content.text.length,
			text: ` b${ i }`,
		} );
		catchUp( server, bob.client );
	}
	const report = flushClient( server, bob.client );
	assertReportExact( report );
	assert.equal(
		getBlock( headDoc( server ), 'p3' ).fields.content.text,
		'Tail b0 b1 b2 b3 b4'
	);
	assert.equal(
		getBlock( headDoc( server ), 'p1' ).fields.content.text,
		'a4 a3 a2 a1 a0 Hello world'
	);
	assert.equal(
		canonicalJson( bob.client.doc ),
		canonicalJson( headDoc( server ) )
	);
} );

test( 'redelivering a flushed batch is idempotent, including proposals', () => {
	const server = createServer( baseDoc() );
	const alice = makeActorClient( 'alice' );
	const bob = makeActorClient( 'bob' );

	alice.author( IntentTypes.REPLACE_ATTR_CONTENT, {
		syncId: 'p1',
		newText: 'Rewritten.',
		observedVersion: 0,
	} );
	flushClient( server, alice.client );

	bob.author( IntentTypes.INSERT_TEXT, {
		syncId: 'p1',
		offset: 0,
		text: 'x',
	} );
	bob.author( IntentTypes.INSERT_TEXT, {
		syncId: 'p3',
		offset: 0,
		text: 'y',
	} );
	const batch = [ ...bob.client.outbox ];
	const report = flushClient( server, bob.client );

	const logLength = server.log.length;
	const proposalCount = server.proposals.length;
	const redelivered = serverIngestBatch( server, batch );
	assert.equal( server.log.length, logLength );
	assert.equal( server.proposals.length, proposalCount );
	assert.deepEqual(
		redelivered,
		report.map( ( row ) => row.actual )
	);
} );

test( 'trimClientLog bounds the replica: history below the replan floor drops, predictions stay exact', () => {
	const server = createServer( baseDoc() );
	const alice = makeActorClient( 'alice' );
	const bob = makeActorClient( 'bob' );

	// Bob accumulates a long observed log with an empty outbox: everything
	// below the cursor is trimmable.
	for ( let i = 0; i < 20; i++ ) {
		alice.author( IntentTypes.INSERT_TEXT, {
			syncId: 'p1',
			offset: 0,
			text: 'a',
		} );
		flushClient( server, alice.client );
		catchUp( server, bob.client );
	}
	assert.equal( bob.client.log.length, 0 );
	assert.equal( bob.client.firstSeq, bob.client.cursor );

	// Pending work pins the floor at its baseSeq: entries the replan still
	// needs survive the trim, and prediction parity holds through it.
	bob.author( IntentTypes.INSERT_TEXT, {
		syncId: 'p3',
		offset: 0,
		text: 'z',
	} );
	alice.author( IntentTypes.INSERT_TEXT, {
		syncId: 'p1',
		offset: 0,
		text: 'b',
	} );
	flushClient( server, alice.client );
	catchUp( server, bob.client );
	assert.ok( bob.client.firstSeq <= bob.client.outbox[ 0 ].baseSeq );
	const report = flushClient( server, bob.client );
	for ( const row of report ) {
		assert.deepEqual( row.predicted, row.actual );
	}
} );

test( 'a replica bootstrapped from a checkpoint (firstSeq > 0) plans identically to a genesis replica', () => {
	// Build history on a genesis server.
	const server = createServer( baseDoc() );
	const alice = makeActorClient( 'alice' );
	for ( let i = 0; i < 5; i++ ) {
		alice.author( IntentTypes.INSERT_TEXT, {
			syncId: 'p1',
			offset: 0,
			text: 'a',
		} );
	}
	flushClient( server, alice.client );

	// A late replica bootstraps from the head as a checkpoint.
	const checkpointDoc = serverDocAt( server, server.log.length );
	const late = createClient( 'late', checkpointDoc, server.log.length );
	assert.equal( late.cursor, 5 );

	// It authors against the checkpoint and rebases over later entries.
	const pending = createIntent(
		IntentTypes.INSERT_TEXT,
		{ syncId: 'p1', offset: 0, text: 'L' },
		{ actorId: 'late', baseSeq: late.cursor, intentId: 'late#0' }
	);
	authorIntent( late, pending );
	alice.author( IntentTypes.INSERT_TEXT, {
		syncId: 'p1',
		offset: 1,
		text: 'c',
	} );
	flushClient( server, alice.client );
	clientReceive( late, server.log.slice( 5 ), 5 );
	const predicted = predictedDisposition( late, 'late#0' );
	const [ actual ] = serverIngestBatch( server, [ pending ] );
	assert.deepEqual( predicted, actual );
} );
