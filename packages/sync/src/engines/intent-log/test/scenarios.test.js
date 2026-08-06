/**
 * Curated concurrent-merge scenarios with EXACT pinned outcomes.
 *
 * The matrix test guarantees the whole pairwise surface terminates
 * consistently; this file pins the semantics of the merges a human would
 * reason about — where the text lands, which side wins a register race,
 * what parks for review — so an engine change that silently alters merge
 * MEANING (while still converging) fails loudly.
 */

import assert from 'node:assert/strict';

import { canonicalJson, createDocument, getBlock } from '../document.js';
import { IntentTypes, createIntent } from '../intents.js';
import { createServer, serverDocAt, serverIngestBatch } from '../rebase.js';
import { authorIntent, createClient, flushClient } from '../client.js';

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

const makeActor =
	( actorId, counter = { n: 0 } ) =>
	( type, payload, extra = {} ) =>
		createIntent( type, payload, {
			actorId,
			baseSeq: 0,
			intentId: `${ actorId }#${ counter.n++ }`,
			...extra,
		} );

const headDoc = ( server ) => serverDocAt( server, server.log.length );

test( 'split × split on the same block partitions into three exact pieces', () => {
	const server = createServer( baseDoc() );
	serverIngestBatch( server, [
		makeActor( 'alice' )( IntentTypes.SPLIT_BLOCK, {
			syncId: 'p1',
			offset: 5,
			newSyncId: 'a-tail',
		} ),
	] );
	// bob's split at 8 was authored against "Hello world"; after alice's
	// split at 5, position 8 lives in the tail at offset 3.
	const [ disposition ] = serverIngestBatch( server, [
		makeActor( 'bob' )( IntentTypes.SPLIT_BLOCK, {
			syncId: 'p1',
			offset: 8,
			newSyncId: 'b-tail',
		} ),
	] );
	assert.equal( disposition.status, 'applied' );
	const doc = headDoc( server );
	assert.equal( getBlock( doc, 'p1' ).fields.content.text, 'Hello' );
	assert.equal( getBlock( doc, 'a-tail' ).fields.content.text, ' wo' );
	assert.equal( getBlock( doc, 'b-tail' ).fields.content.text, 'rld' );
	// Identity lineage: both tails point at the block they split from.
	assert.equal( getBlock( doc, 'a-tail' ).syncParent, 'p1' );
	assert.equal( getBlock( doc, 'b-tail' ).syncParent, 'a-tail' );
} );

test( 'split × insert at the exact split point lands at the head of the tail', () => {
	const server = createServer( baseDoc() );
	serverIngestBatch( server, [
		makeActor( 'alice' )( IntentTypes.SPLIT_BLOCK, {
			syncId: 'p1',
			offset: 5,
			newSyncId: 'a-tail',
		} ),
	] );
	const [ disposition ] = serverIngestBatch( server, [
		makeActor( 'bob' )( IntentTypes.INSERT_TEXT, {
			syncId: 'p1',
			offset: 5,
			text: '*',
		} ),
	] );
	assert.equal( disposition.status, 'applied' );
	const doc = headDoc( server );
	assert.equal( getBlock( doc, 'p1' ).fields.content.text, 'Hello' );
	assert.equal( getBlock( doc, 'a-tail' ).fields.content.text, '* world' );
} );

test( 'split × format across the split point clips to the first half (formats never escalate)', () => {
	const server = createServer( baseDoc() );
	serverIngestBatch( server, [
		makeActor( 'alice' )( IntentTypes.SPLIT_BLOCK, {
			syncId: 'p1',
			offset: 5,
			newSyncId: 'a-tail',
		} ),
	] );
	const [ formatCrossing, deleteCrossing ] = serverIngestBatch( server, [
		makeActor( 'bob' )( IntentTypes.FORMAT_TEXT, {
			syncId: 'p1',
			start: 3,
			end: 8,
			format: 'bold',
			on: true,
		} ),
		makeActor( 'bob', { n: 1 } )( IntentTypes.DELETE_TEXT, {
			syncId: 'p1',
			start: 3,
			end: 8,
			removedText: 'lo wo',
		} ),
	] );
	assert.equal( formatCrossing.status, 'applied' );
	// The destructive twin of the same range still escalates.
	assert.deepEqual( deleteCrossing, {
		status: 'escalated',
		reason: 'range-crosses-split',
	} );
	assert.deepEqual(
		getBlock( headDoc( server ), 'p1' ).fields.content.formats,
		[ { start: 3, end: 5, format: 'bold' } ]
	);
} );

test( 'merge × delete inside the absorbed block follows it across the join', () => {
	const server = createServer( baseDoc() );
	serverIngestBatch( server, [
		makeActor( 'alice' )( IntentTypes.MERGE_BLOCKS, {
			survivorId: 'p1',
			absorbedId: 'p3',
			joinOffset: 11,
		} ),
	] );
	// bob deletes "ai" from "Tail" (offsets 1..3), authored pre-merge.
	const [ disposition ] = serverIngestBatch( server, [
		makeActor( 'bob' )( IntentTypes.DELETE_TEXT, {
			syncId: 'p3',
			start: 1,
			end: 3,
			removedText: 'ai',
		} ),
	] );
	assert.equal( disposition.status, 'applied' );
	assert.equal(
		getBlock( headDoc( server ), 'p1' ).fields.content.text,
		'Hello worldTl'
	);
} );

test( 'merge × merge of the same pair: the second voids instead of double-appending', () => {
	const server = createServer( baseDoc() );
	serverIngestBatch( server, [
		makeActor( 'alice' )( IntentTypes.MERGE_BLOCKS, {
			survivorId: 'p1',
			absorbedId: 'p3',
			joinOffset: 11,
		} ),
	] );
	const [ disposition ] = serverIngestBatch( server, [
		makeActor( 'bob' )( IntentTypes.MERGE_BLOCKS, {
			survivorId: 'p1',
			absorbedId: 'p3',
			joinOffset: 11,
		} ),
	] );
	assert.deepEqual( disposition, {
		status: 'voided',
		reason: 'already-merged',
	} );
	assert.equal(
		getBlock( headDoc( server ), 'p1' ).fields.content.text,
		'Hello worldTail'
	);
} );

test( 'move × move of the same block: last mover wins, no duplication', () => {
	const server = createServer( baseDoc() );
	serverIngestBatch( server, [
		makeActor( 'alice' )( IntentTypes.MOVE_BLOCK, {
			syncId: 'p3',
			newParentId: 'g1',
			afterSiblingId: 'p2',
		} ),
	] );
	const [ disposition ] = serverIngestBatch( server, [
		makeActor( 'bob' )( IntentTypes.MOVE_BLOCK, {
			syncId: 'p3',
			newParentId: null,
			afterSiblingId: null,
		} ),
	] );
	assert.equal( disposition.status, 'applied' );
	const doc = headDoc( server );
	assert.equal( doc.root[ 0 ].syncId, 'p3' );
	assert.equal( getBlock( doc, 'g1' ).children.length, 1 );
	assert.equal(
		doc.root.length + getBlock( doc, 'g1' ).children.length,
		4,
		'block count preserved — no duplicate p3'
	);
} );

test( 'move × concurrent removal of the destination parent escalates the move', () => {
	const server = createServer( baseDoc() );
	serverIngestBatch( server, [
		makeActor( 'alice' )( IntentTypes.REMOVE_BLOCK, { syncId: 'g1' } ),
	] );
	const [ disposition ] = serverIngestBatch( server, [
		makeActor( 'bob' )( IntentTypes.MOVE_BLOCK, {
			syncId: 'p3',
			newParentId: 'g1',
			afterSiblingId: 'p2',
		} ),
	] );
	assert.deepEqual( disposition, {
		status: 'escalated',
		reason: 'target-deleted',
	} );
	assert.ok( getBlock( headDoc( server ), 'p3' ), 'p3 still in place' );
} );

test( 'circular concurrent moves converge without duplicating either block', () => {
	// alice moves p1 under g1; bob moves g1 after p3. Applied in log order,
	// the second must not create a cycle or lose a subtree.
	const server = createServer( baseDoc() );
	serverIngestBatch( server, [
		makeActor( 'alice' )( IntentTypes.MOVE_BLOCK, {
			syncId: 'p1',
			newParentId: 'g1',
			afterSiblingId: 'p2',
		} ),
	] );
	const [ disposition ] = serverIngestBatch( server, [
		makeActor( 'bob' )( IntentTypes.MOVE_BLOCK, {
			syncId: 'g1',
			newParentId: null,
			afterSiblingId: 'p3',
		} ),
	] );
	assert.equal( disposition.status, 'applied' );
	const doc = headDoc( server );
	assert.deepEqual(
		doc.root.map( ( block ) => block.syncId ),
		[ 'p3', 'g1' ]
	);
	assert.deepEqual(
		getBlock( doc, 'g1' ).children.map( ( block ) => block.syncId ),
		[ 'p2', 'p1' ]
	);
} );

test( 'true cyclic pair (A under B, B under A) voids the loser with a recorded reason', () => {
	const server = createServer( baseDoc() );
	serverIngestBatch( server, [
		makeActor( 'alice' )( IntentTypes.MOVE_BLOCK, {
			syncId: 'p1',
			newParentId: 'g1',
			afterSiblingId: 'p2',
		} ),
	] );
	// bob concurrently moves g1 under p1 — after alice's move applies, this
	// would parent g1 inside its own descendant.
	const [ disposition ] = serverIngestBatch( server, [
		makeActor( 'bob' )( IntentTypes.MOVE_BLOCK, {
			syncId: 'g1',
			newParentId: 'p1',
			afterSiblingId: null,
		} ),
	] );
	assert.deepEqual( disposition, { status: 'voided', reason: 'cycle' } );
	// Everything still reachable exactly once.
	const doc = headDoc( server );
	const count = ( blocks ) =>
		blocks.reduce( ( sum, block ) => sum + 1 + count( block.children ), 0 );
	assert.equal( count( doc.root ), 4 );
} );

test( 'register race: set × remove of the same key escalates the loser both ways', () => {
	for ( const [ first, second ] of [
		[ IntentTypes.SET_ATTR, IntentTypes.REMOVE_ATTR ],
		[ IntentTypes.REMOVE_ATTR, IntentTypes.SET_ATTR ],
	] ) {
		const server = createServer( baseDoc() );
		const payload = ( type ) =>
			type === IntentTypes.SET_ATTR
				? {
						syncId: 'p1',
						key: 'align',
						value: 'wide',
						observedVersion: 0,
				  }
				: { syncId: 'p1', key: 'align', observedVersion: 0 };
		serverIngestBatch( server, [
			makeActor( 'alice' )( first, payload( first ) ),
		] );
		const [ disposition ] = serverIngestBatch( server, [
			makeActor( 'bob' )( second, payload( second ) ),
		] );
		assert.deepEqual(
			disposition,
			{ status: 'escalated', reason: 'attr-conflict' },
			`${ first } then ${ second }`
		);
	}
} );

test( 'transform × transform: last writer wins by log order (no escalation)', () => {
	const server = createServer( baseDoc() );
	serverIngestBatch( server, [
		makeActor( 'alice' )( IntentTypes.TRANSFORM_BLOCK, {
			syncId: 'p1',
			newBlockType: 'core/heading',
		} ),
	] );
	const [ disposition ] = serverIngestBatch( server, [
		makeActor( 'bob' )( IntentTypes.TRANSFORM_BLOCK, {
			syncId: 'p1',
			newBlockType: 'core/quote',
		} ),
	] );
	assert.equal( disposition.status, 'applied' );
	assert.equal( getBlock( headDoc( server ), 'p1' ).blockType, 'core/quote' );
} );

test( 'coarse rewrite parks concurrent text but leaves map writes and moves alone', () => {
	const server = createServer( baseDoc() );
	serverIngestBatch( server, [
		makeActor( 'agent' )( IntentTypes.REPLACE_ATTR_CONTENT, {
			syncId: 'p1',
			newText: 'Rewritten by agent.',
			observedVersion: 0,
		} ),
	] );
	const bob = makeActor( 'bob' );
	const [ text, attr, move ] = serverIngestBatch( server, [
		bob( IntentTypes.INSERT_TEXT, { syncId: 'p1', offset: 0, text: 'x' } ),
		bob( IntentTypes.SET_ATTR, {
			syncId: 'p1',
			key: 'align',
			value: 'wide',
			observedVersion: 0,
		} ),
		bob( IntentTypes.MOVE_BLOCK, {
			syncId: 'p1',
			newParentId: null,
			afterSiblingId: 'p3',
		} ),
	] );
	assert.deepEqual( text, {
		status: 'escalated',
		reason: 'content-replaced',
	} );
	assert.equal( attr.status, 'applied' );
	assert.equal( move.status, 'applied' );
	const doc = headDoc( server );
	assert.equal(
		getBlock( doc, 'p1' ).fields.content.text,
		'Rewritten by agent.'
	);
	assert.equal( getBlock( doc, 'p1' ).attrs.align, 'wide' );
	assert.equal( doc.root.at( -1 ).syncId, 'p1' );
} );

test( 'insert_block anchored to a concurrently removed sibling falls back to end-of-list, in order', () => {
	const server = createServer( baseDoc() );
	serverIngestBatch( server, [
		makeActor( 'alice' )( IntentTypes.REMOVE_BLOCK, { syncId: 'p1' } ),
	] );
	const [ disposition ] = serverIngestBatch( server, [
		makeActor( 'bob' )( IntentTypes.INSERT_BLOCK, {
			block: { syncId: 'bob-new', blockType: 'core/paragraph' },
			parentId: null,
			afterSiblingId: 'p1',
		} ),
	] );
	// The anchor is gone but the parent (root) survives: ordering degrades
	// gracefully instead of losing the insert.
	assert.equal( disposition.status, 'applied' );
	const doc = headDoc( server );
	assert.ok( getBlock( doc, 'bob-new' ) );
	assert.equal( doc.root.at( -1 ).syncId, 'bob-new' );
} );

test( 'deep offline batch over a fully rewritten document: all clean work merges, all stale work parks', () => {
	const server = createServer( baseDoc() );
	const alice = createClient( 'alice', baseDoc() );
	const bob = createClient( 'bob', baseDoc() );
	const authorFor =
		( client ) =>
		( type, payload, extra = {} ) => {
			const intent = createIntent( type, payload, {
				actorId: client.actorId,
				baseSeq: client.cursor,
				intentId: `${ client.actorId }#${ client.nextIntent++ }`,
				...extra,
			} );
			authorIntent( client, intent );
			return intent;
		};
	const authorAlice = authorFor( alice );
	const authorBob = authorFor( bob );

	// bob works offline: edits p1, splits p3, adds a block, tags p2.
	authorBob( IntentTypes.INSERT_TEXT, {
		syncId: 'p1',
		offset: 11,
		text: '!!',
	} );
	authorBob( IntentTypes.SPLIT_BLOCK, {
		syncId: 'p3',
		offset: 2,
		newSyncId: 'b-t2',
	} );
	authorBob( IntentTypes.INSERT_BLOCK, {
		block: { syncId: 'b-para', blockType: 'core/paragraph' },
		parentId: null,
		afterSiblingId: null,
	} );
	authorBob( IntentTypes.SET_ATTR, {
		syncId: 'p2',
		key: 'align',
		value: 'full',
		observedVersion: 0,
	} );

	// Meanwhile alice replaces p1 wholesale and deletes inside p3.
	authorAlice( IntentTypes.REPLACE_ATTR_CONTENT, {
		syncId: 'p1',
		newText: 'Alice rewrote this.',
		observedVersion: 0,
	} );
	authorAlice( IntentTypes.DELETE_TEXT, {
		syncId: 'p3',
		start: 1,
		end: 3,
		removedText: 'ai',
	} );
	flushClient( server, alice );

	const report = flushClient( server, bob );
	const statuses = Object.fromEntries(
		report.map( ( row ) => [ row.intentId, row.actual ] )
	);
	// p1 edit hits the rewrite → parked. Split of p3 crosses alice's delete?
	// No — her delete [1,3) is inside the head half after his split at 2?
	// His split offset 2 vs her delete [1,3): the delete straddles his
	// split point, but HER edit is already accepted — HIS split maps
	// through her delete: offset 2 is inside the deleted range → parked.
	assert.deepEqual( statuses[ 'bob#0' ], {
		status: 'escalated',
		reason: 'content-replaced',
	} );
	assert.deepEqual( statuses[ 'bob#1' ], {
		status: 'escalated',
		reason: 'position-in-deleted-range',
	} );
	// Fresh block and disjoint attr write merge clean.
	assert.deepEqual( statuses[ 'bob#2' ], { status: 'applied' } );
	assert.deepEqual( statuses[ 'bob#3' ], { status: 'applied' } );

	for ( const row of report ) {
		assert.deepEqual( row.predicted, row.actual, `${ row.intentId }` );
	}
	const doc = headDoc( server );
	assert.equal(
		getBlock( doc, 'p1' ).fields.content.text,
		'Alice rewrote this.'
	);
	assert.equal( getBlock( doc, 'p3' ).fields.content.text, 'Tl' );
	assert.ok( getBlock( doc, 'b-para' ) );
	assert.equal( getBlock( doc, 'p2' ).attrs.align, 'full' );
	assert.equal( server.proposals.length, 2 );
	assert.equal( canonicalJson( bob.doc ), canonicalJson( doc ) );
} );

test( 'attribution: a transformed, escalated proposal still carries its original author through the client path', () => {
	const server = createServer( baseDoc() );
	const alice = createClient( 'alice', baseDoc() );
	const bob = createClient( 'bob', baseDoc() );
	authorIntent(
		alice,
		createIntent(
			IntentTypes.INSERT_TEXT,
			{ syncId: 'p1', offset: 0, text: 'A: ' },
			{ actorId: 'alice', baseSeq: 0, intentId: 'alice#0' }
		)
	);
	authorIntent(
		bob,
		createIntent(
			IntentTypes.DELETE_TEXT,
			// Will be shifted by alice's insert, then escalate against the
			// agent rewrite below.
			{ syncId: 'p1', start: 0, end: 5, removedText: 'Hello' },
			{ actorId: 'bob', baseSeq: 0, intentId: 'bob#0' }
		)
	);
	flushClient( server, alice );
	serverIngestBatch( server, [
		createIntent(
			IntentTypes.REPLACE_ATTR_CONTENT,
			{ syncId: 'p1', newText: 'Agent.', observedVersion: 0 },
			{
				actorId: 'agent',
				baseSeq: server.log.length,
				intentId: 'agent#0',
			}
		),
	] );
	flushClient( server, bob );
	assert.equal( server.proposals.length, 1 );
	const proposal = server.proposals[ 0 ];
	assert.equal( proposal.actorId, 'bob' );
	assert.equal( proposal.intent.actorId, 'bob' );
	assert.equal( proposal.intent.intentId, 'bob#0' );
} );
