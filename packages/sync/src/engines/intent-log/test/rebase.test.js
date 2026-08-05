import assert from 'node:assert/strict';

import { createDocument, getBlock } from '../document.js';
import { IntentTypes, createIntent } from '../intents.js';
import { createServer, serverDocAt, serverIngestBatch } from '../rebase.js';

const baseDoc = () =>
	createDocument( [
		{ syncId: 'p1', blockType: 'core/paragraph', text: 'Hello world' },
		{
			syncId: 'g1',
			blockType: 'core/group',
			children: [
				{
					syncId: 'p2',
					blockType: 'core/paragraph',
					text: 'Nested',
				},
			],
		},
		{ syncId: 'p3', blockType: 'core/paragraph', text: 'Tail' },
	] );

const makeActor =
	( actorId ) =>
	( type, payload, extra = {} ) =>
		createIntent( type, payload, { actorId, baseSeq: 0, ...extra } );

const headDoc = ( server ) => serverDocAt( server, server.log.length );

test( 'disjoint concurrent edits merge cleanly with shifted offsets', () => {
	const server = createServer( baseDoc() );
	const alice = makeActor( 'alice' );
	const bob = makeActor( 'bob' );
	serverIngestBatch( server, [
		alice( IntentTypes.INSERT_TEXT, {
			syncId: 'p1',
			offset: 0,
			text: 'A: ',
		} ),
	] );
	const [ disposition ] = serverIngestBatch( server, [
		bob( IntentTypes.INSERT_TEXT, {
			syncId: 'p1',
			offset: 11,
			text: '!',
		} ),
	] );
	assert.equal( disposition.status, 'applied' );
	assert.equal(
		getBlock( headDoc( server ), 'p1' ).fields.content.text,
		'A: Hello world!'
	);
} );

test( 'same-offset inserts resolve by log order without interleaving', () => {
	const server = createServer( baseDoc() );
	serverIngestBatch( server, [
		makeActor( 'alice' )( IntentTypes.INSERT_TEXT, {
			syncId: 'p1',
			offset: 5,
			text: ' brave',
		} ),
	] );
	serverIngestBatch( server, [
		makeActor( 'bob' )( IntentTypes.INSERT_TEXT, {
			syncId: 'p1',
			offset: 5,
			text: ' cruel',
		} ),
	] );
	assert.equal(
		getBlock( headDoc( server ), 'p1' ).fields.content.text,
		'Hello brave cruel world'
	);
} );

test( 'pending text intents retarget across a concurrent split', () => {
	const server = createServer( baseDoc() );
	serverIngestBatch( server, [
		makeActor( 'alice' )( IntentTypes.SPLIT_BLOCK, {
			syncId: 'p1',
			offset: 5,
			newSyncId: 'p1b',
		} ),
	] );
	const [ disposition ] = serverIngestBatch( server, [
		makeActor( 'bob' )( IntentTypes.INSERT_TEXT, {
			syncId: 'p1',
			offset: 6,
			text: 'big ',
		} ),
	] );
	assert.equal( disposition.status, 'applied' );
	const doc = headDoc( server );
	assert.equal( getBlock( doc, 'p1' ).fields.content.text, 'Hello' );
	assert.equal( getBlock( doc, 'p1b' ).fields.content.text, ' big world' );
} );

test( 'pending text intents follow an absorbed block through a merge', () => {
	const server = createServer( baseDoc() );
	serverIngestBatch( server, [
		makeActor( 'alice' )( IntentTypes.MERGE_BLOCKS, {
			survivorId: 'p1',
			absorbedId: 'p3',
			joinOffset: 11,
		} ),
	] );
	const [ disposition ] = serverIngestBatch( server, [
		makeActor( 'bob' )( IntentTypes.INSERT_TEXT, {
			syncId: 'p3',
			offset: 2,
			text: 'X',
		} ),
	] );
	assert.equal( disposition.status, 'applied' );
	assert.equal(
		getBlock( headDoc( server ), 'p1' ).fields.content.text,
		'Hello worldTaXil'
	);
} );

test( 'same-actor priors are skipped: pipelined intents do not double-shift', () => {
	const server = createServer( baseDoc() );
	const alice = makeActor( 'alice' );
	serverIngestBatch( server, [
		alice( IntentTypes.INSERT_TEXT, {
			syncId: 'p1',
			offset: 0,
			text: 'AA',
		} ),
		alice( IntentTypes.INSERT_TEXT, {
			syncId: 'p1',
			offset: 2,
			text: 'B',
		} ),
	] );
	assert.equal(
		getBlock( headDoc( server ), 'p1' ).fields.content.text,
		'AABHello world'
	);
} );

test( 'escalation rule 1: edits inside a deleted subtree escalate; delete-delete voids clean', () => {
	const server = createServer( baseDoc() );
	serverIngestBatch( server, [
		makeActor( 'alice' )( IntentTypes.REMOVE_BLOCK, { syncId: 'g1' } ),
	] );
	const bob = makeActor( 'bob' );
	const [ edit, redelete ] = serverIngestBatch( server, [
		bob( IntentTypes.INSERT_TEXT, {
			syncId: 'p2',
			offset: 0,
			text: 'lost?',
		} ),
		bob( IntentTypes.REMOVE_BLOCK, { syncId: 'g1' } ),
	] );
	assert.deepEqual( edit, {
		status: 'escalated',
		reason: 'target-deleted',
	} );
	assert.deepEqual( redelete, {
		status: 'voided',
		reason: 'already-removed',
	} );
	assert.equal( server.proposals.length, 1 );
	assert.equal( server.proposals[ 0 ].actorId, 'bob' );
} );

test( 'escalation rule 2: destructive range intersections escalate; formats never do', () => {
	const server = createServer( baseDoc() );
	serverIngestBatch( server, [
		makeActor( 'alice' )( IntentTypes.DELETE_TEXT, {
			syncId: 'p1',
			start: 3,
			end: 8,
			removedText: 'lo wo',
		} ),
	] );
	const bob = makeActor( 'bob' );
	const [ insertInside, replaceOverlap, formatOverlap ] = serverIngestBatch(
		server,
		[
			bob( IntentTypes.INSERT_TEXT, {
				syncId: 'p1',
				offset: 5,
				text: 'X',
			} ),
			bob( IntentTypes.REPLACE_TEXT, {
				syncId: 'p1',
				start: 6,
				end: 10,
				removedText: 'worl',
				text: 'WORL',
			} ),
			bob( IntentTypes.FORMAT_TEXT, {
				syncId: 'p1',
				start: 0,
				end: 11,
				format: 'bold',
				on: true,
			} ),
		]
	);
	assert.equal( insertInside.status, 'escalated' );
	assert.equal( insertInside.reason, 'position-in-deleted-range' );
	assert.equal( replaceOverlap.status, 'escalated' );
	assert.equal( formatOverlap.status, 'applied' );
	const block = getBlock( headDoc( server ), 'p1' );
	assert.equal( block.fields.content.text, 'Helrld' );
	assert.deepEqual( block.fields.content.formats, [
		{ start: 0, end: 6, format: 'bold' },
	] );
} );

test( 'overlapping deletes are a clean set difference', () => {
	const server = createServer( baseDoc() );
	serverIngestBatch( server, [
		makeActor( 'alice' )( IntentTypes.DELETE_TEXT, {
			syncId: 'p1',
			start: 0,
			end: 6,
			removedText: 'Hello ',
		} ),
	] );
	const [ partial ] = serverIngestBatch( server, [
		makeActor( 'bob' )( IntentTypes.DELETE_TEXT, {
			syncId: 'p1',
			start: 3,
			end: 8,
			removedText: 'lo wo',
		} ),
	] );
	assert.equal( partial.status, 'applied' );
	assert.equal(
		getBlock( headDoc( server ), 'p1' ).fields.content.text,
		'rld'
	);
	const server2 = createServer( baseDoc() );
	serverIngestBatch( server2, [
		makeActor( 'alice' )( IntentTypes.DELETE_TEXT, {
			syncId: 'p1',
			start: 0,
			end: 11,
			removedText: 'Hello world',
		} ),
	] );
	const [ fullyGone ] = serverIngestBatch( server2, [
		makeActor( 'bob' )( IntentTypes.DELETE_TEXT, {
			syncId: 'p1',
			start: 3,
			end: 8,
			removedText: 'lo wo',
		} ),
	] );
	assert.deepEqual( fullyGone, {
		status: 'voided',
		reason: 'already-deleted',
	} );
} );

test( 'escalation rule 3: losing the per-key register race escalates', () => {
	const server = createServer( baseDoc() );
	serverIngestBatch( server, [
		makeActor( 'alice' )( IntentTypes.SET_ATTR, {
			syncId: 'p1',
			key: 'align',
			value: 'wide',
			observedVersion: 0,
		} ),
	] );
	const [ conflict, otherKey ] = serverIngestBatch( server, [
		makeActor( 'bob' )( IntentTypes.SET_ATTR, {
			syncId: 'p1',
			key: 'align',
			value: 'full',
			observedVersion: 0,
		} ),
		makeActor( 'bob' )( IntentTypes.SET_ATTR, {
			syncId: 'p1',
			key: 'dropCap',
			value: true,
			observedVersion: 0,
		} ),
	] );
	assert.deepEqual( conflict, {
		status: 'escalated',
		reason: 'attr-conflict',
	} );
	assert.equal( otherKey.status, 'applied' );
} );

test( 'coarse replace_attr_content escalates every concurrent text edit', () => {
	const server = createServer( baseDoc() );
	serverIngestBatch( server, [
		makeActor( 'agent' )( IntentTypes.REPLACE_ATTR_CONTENT, {
			syncId: 'p1',
			newText: 'Rewritten by a bot',
			observedVersion: 0,
		} ),
	] );
	const [ disposition ] = serverIngestBatch( server, [
		makeActor( 'bob' )( IntentTypes.INSERT_TEXT, {
			syncId: 'p1',
			offset: 0,
			text: 'x',
		} ),
	] );
	assert.deepEqual( disposition, {
		status: 'escalated',
		reason: 'content-replaced',
	} );
} );

test( 'escalation rule 4: a txn unit escalates atomically', () => {
	const server = createServer( baseDoc() );
	serverIngestBatch( server, [
		makeActor( 'alice' )( IntentTypes.SET_ATTR, {
			syncId: 'p1',
			key: 'align',
			value: 'wide',
			observedVersion: 0,
		} ),
	] );
	const bob = makeActor( 'bob' );
	const results = serverIngestBatch( server, [
		bob(
			IntentTypes.INSERT_TEXT,
			{ syncId: 'p3', offset: 0, text: 'safe ' },
			{ txnId: 't1' }
		),
		bob(
			IntentTypes.SET_ATTR,
			{ syncId: 'p1', key: 'align', value: 'full', observedVersion: 0 },
			{ txnId: 't1' }
		),
	] );
	assert.deepEqual(
		results.map( ( r ) => r.status ),
		[ 'escalated', 'escalated' ]
	);
	assert.equal(
		getBlock( headDoc( server ), 'p3' ).fields.content.text,
		'Tail'
	);
	assert.equal( server.proposals.length, 2 );
} );

test( 'ingest is idempotent per intentId', () => {
	const server = createServer( baseDoc() );
	const intent = makeActor( 'alice' )( IntentTypes.INSERT_TEXT, {
		syncId: 'p1',
		offset: 0,
		text: 'x',
	} );
	const [ first ] = serverIngestBatch( server, [ intent ] );
	const [ second ] = serverIngestBatch( server, [ intent ] );
	assert.deepEqual( first, second );
	assert.equal( server.log.length, 1 );
} );

test( 'attribution is preserved through rebase transforms', () => {
	const server = createServer( baseDoc() );
	serverIngestBatch( server, [
		makeActor( 'alice' )( IntentTypes.INSERT_TEXT, {
			syncId: 'p1',
			offset: 0,
			text: 'A: ',
		} ),
	] );
	serverIngestBatch( server, [
		makeActor( 'bob' )( IntentTypes.INSERT_TEXT, {
			syncId: 'p1',
			offset: 11,
			text: '!',
		} ),
	] );
	const shifted = server.log[ 1 ];
	assert.equal( shifted.actorId, 'bob' );
	assert.equal( shifted.payload.offset, 14 );
} );
