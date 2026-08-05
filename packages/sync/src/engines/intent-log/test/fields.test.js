/**
 * Field-scoped conflict granularity: blocks with several rich-text fields
 * (quote value + citation). The contract under test:
 *
 * - concurrent edits to DIFFERENT fields of the same block never conflict —
 *   not in rebase, not in the frame rules;
 * - concurrent edits to the SAME field conflict exactly as before;
 * - split moves only the split field to the tail; merge joins only the
 *   merged field and escalates concurrent edits to the fields it drops.
 */

import assert from 'node:assert/strict';

import { canonicalJson, createDocument, getBlock } from '../document.js';
import { IntentTypes, createIntent } from '../intents.js';
import { createServer, serverDocAt, serverIngestBatch } from '../rebase.js';
import {
	authorIntent,
	createClient,
	flushClient,
	predictedDisposition,
} from '../client.js';

const baseDoc = () =>
	createDocument( [
		{
			syncId: 'q1',
			blockType: 'core/quote',
			fields: {
				content: { text: 'To be or not to be' },
				citation: { text: 'Shakespeare' },
			},
		},
		{
			syncId: 'q2',
			blockType: 'core/quote',
			fields: {
				content: { text: 'Brevity is the soul of wit' },
				citation: { text: 'Polonius' },
			},
		},
		{ syncId: 'p1', blockType: 'core/paragraph', text: 'A paragraph.' },
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

test( 'intents default to the content field; explicit fields are preserved', () => {
	const plain = createIntent(
		IntentTypes.INSERT_TEXT,
		{ syncId: 'q1', offset: 0, text: 'x' },
		{ actorId: 'a', baseSeq: 0 }
	);
	assert.equal( plain.payload.field, 'content' );
	const cited = createIntent(
		IntentTypes.INSERT_TEXT,
		{ syncId: 'q1', field: 'citation', offset: 0, text: 'x' },
		{ actorId: 'a', baseSeq: 0 }
	);
	assert.equal( cited.payload.field, 'citation' );
} );

test( 'concurrent destructive edits to different fields of one block both apply', () => {
	const server = createServer( baseDoc() );
	serverIngestBatch( server, [
		makeActor( 'alice' )( IntentTypes.REPLACE_TEXT, {
			syncId: 'q1',
			field: 'content',
			start: 0,
			end: 5,
			removedText: 'To be',
			text: 'To exist',
		} ),
	] );
	// bob's citation edit was authored against the same base and overlaps
	// the same OFFSETS — but a different field, so no conflict.
	const [ disposition ] = serverIngestBatch( server, [
		makeActor( 'bob' )( IntentTypes.REPLACE_TEXT, {
			syncId: 'q1',
			field: 'citation',
			start: 0,
			end: 11,
			removedText: 'Shakespeare',
			text: 'W. Shakespeare',
		} ),
	] );
	assert.deepEqual( disposition, { status: 'applied' } );
	const block = getBlock( headDoc( server ), 'q1' );
	assert.equal( block.fields.content.text, 'To exist or not to be' );
	assert.equal( block.fields.citation.text, 'W. Shakespeare' );
} );

test( 'same-field concurrent overlap still escalates (granularity did not overshoot)', () => {
	const server = createServer( baseDoc() );
	serverIngestBatch( server, [
		makeActor( 'alice' )( IntentTypes.REPLACE_TEXT, {
			syncId: 'q1',
			field: 'citation',
			start: 0,
			end: 11,
			removedText: 'Shakespeare',
			text: 'Bacon',
		} ),
	] );
	const [ disposition ] = serverIngestBatch( server, [
		makeActor( 'bob' )( IntentTypes.REPLACE_TEXT, {
			syncId: 'q1',
			field: 'citation',
			start: 0,
			end: 11,
			removedText: 'Shakespeare',
			text: 'Marlowe',
		} ),
	] );
	assert.deepEqual( disposition, {
		status: 'escalated',
		reason: 'concurrent-replace-overlap',
	} );
} );

test( 'coarse rewrite of one field leaves concurrent edits to the other field clean', () => {
	const server = createServer( baseDoc() );
	serverIngestBatch( server, [
		makeActor( 'agent' )( IntentTypes.REPLACE_ATTR_CONTENT, {
			syncId: 'q1',
			field: 'content',
			newText: 'Rewritten by agent.',
			observedVersion: 0,
		} ),
	] );
	const bob = makeActor( 'bob' );
	const [ sameField, otherField ] = serverIngestBatch( server, [
		bob( IntentTypes.INSERT_TEXT, {
			syncId: 'q1',
			field: 'content',
			offset: 0,
			text: 'x',
		} ),
		bob( IntentTypes.INSERT_TEXT, {
			syncId: 'q1',
			field: 'citation',
			offset: 0,
			text: 'William ',
		} ),
	] );
	assert.deepEqual( sameField, {
		status: 'escalated',
		reason: 'content-replaced',
	} );
	assert.deepEqual( otherField, { status: 'applied' } );
	const block = getBlock( headDoc( server ), 'q1' );
	assert.equal( block.fields.content.text, 'Rewritten by agent.' );
	assert.equal( block.fields.citation.text, 'William Shakespeare' );
} );

test( 'split moves only the split field; the citation stays whole on the head', () => {
	const server = createServer( baseDoc() );
	serverIngestBatch( server, [
		makeActor( 'alice' )( IntentTypes.SPLIT_BLOCK, {
			syncId: 'q1',
			field: 'content',
			offset: 5,
			newSyncId: 'q1-tail',
		} ),
	] );
	const doc = headDoc( server );
	const head = getBlock( doc, 'q1' );
	const tail = getBlock( doc, 'q1-tail' );
	assert.equal( head.fields.content.text, 'To be' );
	assert.equal( head.fields.citation.text, 'Shakespeare' );
	assert.equal( tail.fields.content.text, ' or not to be' );
	assert.equal( tail.fields.citation, undefined );
	assert.equal( tail.syncParent, 'q1' );
} );

test( 'a citation edit rides through a concurrent content split untouched', () => {
	const server = createServer( baseDoc() );
	serverIngestBatch( server, [
		makeActor( 'alice' )( IntentTypes.SPLIT_BLOCK, {
			syncId: 'q1',
			field: 'content',
			offset: 5,
			newSyncId: 'q1-tail',
		} ),
	] );
	// Offset 8 would cross the split point in content coordinates; in the
	// citation's frame it is untouched by the split.
	const [ disposition ] = serverIngestBatch( server, [
		makeActor( 'bob' )( IntentTypes.INSERT_TEXT, {
			syncId: 'q1',
			field: 'citation',
			offset: 11,
			text: ' (1600)',
		} ),
	] );
	assert.deepEqual( disposition, { status: 'applied' } );
	assert.equal(
		getBlock( headDoc( server ), 'q1' ).fields.citation.text,
		'Shakespeare (1600)'
	);
} );

test( 'merge joins the named field and escalates concurrent edits to dropped fields', () => {
	const server = createServer( baseDoc() );
	serverIngestBatch( server, [
		makeActor( 'alice' )( IntentTypes.MERGE_BLOCKS, {
			survivorId: 'q1',
			absorbedId: 'q2',
			field: 'content',
			joinOffset: 18,
		} ),
	] );
	const bob = makeActor( 'bob' );
	const [ mergedField, droppedField ] = serverIngestBatch( server, [
		// Edit inside q2's content: follows the content across the join.
		bob( IntentTypes.INSERT_TEXT, {
			syncId: 'q2',
			field: 'content',
			offset: 0,
			text: '>> ',
		} ),
		// Edit to q2's citation: that field was dropped by the merge.
		bob( IntentTypes.INSERT_TEXT, {
			syncId: 'q2',
			field: 'citation',
			offset: 0,
			text: 'old ',
		} ),
	] );
	assert.deepEqual( mergedField, { status: 'applied' } );
	assert.deepEqual( droppedField, {
		status: 'escalated',
		reason: 'merge-dropped-field',
	} );
	const survivor = getBlock( headDoc( server ), 'q1' );
	assert.equal(
		survivor.fields.content.text,
		'To be or not to be>> Brevity is the soul of wit'
	);
	// Survivor keeps its own citation; the absorbed one is gone.
	assert.equal( survivor.fields.citation.text, 'Shakespeare' );
	assert.equal( getBlock( headDoc( server ), 'q2' ), null );
	assert.equal( server.proposals.length, 1 );
	assert.equal( server.proposals[ 0 ].reason, 'merge-dropped-field' );
} );

test( 'a wholesale rewrite of an absorbed block field escalates rather than voiding silently', () => {
	const server = createServer( baseDoc() );
	serverIngestBatch( server, [
		makeActor( 'alice' )( IntentTypes.MERGE_BLOCKS, {
			survivorId: 'q1',
			absorbedId: 'q2',
			field: 'content',
			joinOffset: 18,
		} ),
	] );
	const [ disposition ] = serverIngestBatch( server, [
		makeActor( 'agent' )( IntentTypes.REPLACE_ATTR_CONTENT, {
			syncId: 'q2',
			field: 'content',
			newText: 'Full rewrite.',
			observedVersion: 0,
		} ),
	] );
	assert.deepEqual( disposition, {
		status: 'escalated',
		reason: 'merge-dropped-field',
	} );
} );

test( 'frame rules are field-scoped: pipelined edits to one field survive a remote write to the other', () => {
	const server = createServer( baseDoc() );
	const alice = makeActorClient( 'alice' );
	const bob = makeActorClient( 'bob' );

	// bob pipelines two dependent edits to the CITATION (his second offset
	// only makes sense after his first applies).
	bob.author( IntentTypes.INSERT_TEXT, {
		syncId: 'q1',
		field: 'citation',
		offset: 0,
		text: 'Wm. ',
	} );
	bob.author( IntentTypes.INSERT_TEXT, {
		syncId: 'q1',
		field: 'citation',
		offset: 4,
		text: 'X ',
	} );
	// alice concurrently writes the CONTENT of the same block.
	alice.author( IntentTypes.INSERT_TEXT, {
		syncId: 'q1',
		field: 'content',
		offset: 0,
		text: 'Q: ',
	} );
	flushClient( server, alice.client );

	const report = flushClient( server, bob.client );
	for ( const row of report ) {
		assert.deepEqual( row.predicted, row.actual, row.intentId );
	}
	// No frame-conflict: alice's write is to a different field's frame.
	assert.deepEqual(
		report.map( ( row ) => row.actual ),
		[ { status: 'applied' }, { status: 'applied' } ]
	);
	const block = getBlock( headDoc( server ), 'q1' );
	assert.equal( block.fields.citation.text, 'Wm. X Shakespeare' );
	assert.equal( block.fields.content.text, 'Q: To be or not to be' );
	assert.equal(
		canonicalJson( bob.client.doc ),
		canonicalJson( headDoc( server ) )
	);
} );

test( 'frame rules still catch pipelined edits when the remote write IS the same field', () => {
	const server = createServer( baseDoc() );
	const alice = makeActorClient( 'alice' );
	const bob = makeActorClient( 'bob' );

	bob.author( IntentTypes.INSERT_TEXT, {
		syncId: 'q1',
		field: 'citation',
		offset: 0,
		text: 'Wm. ',
	} );
	bob.author( IntentTypes.INSERT_TEXT, {
		syncId: 'q1',
		field: 'citation',
		offset: 4,
		text: 'X ',
	} );
	alice.author( IntentTypes.INSERT_TEXT, {
		syncId: 'q1',
		field: 'citation',
		offset: 11,
		text: ' the Bard',
	} );
	flushClient( server, alice.client );

	const report = flushClient( server, bob.client );
	for ( const row of report ) {
		assert.deepEqual( row.predicted, row.actual, row.intentId );
	}
	assert.deepEqual( report[ 0 ].actual, { status: 'applied' } );
	assert.deepEqual( report[ 1 ].actual, {
		status: 'escalated',
		reason: 'frame-conflict',
	} );
} );

test( 'a merge poisons pending coordinates for ALL fields of the absorbed block (block-wide frame key)', () => {
	const server = createServer( baseDoc() );
	const alice = makeActorClient( 'alice' );
	const bob = makeActorClient( 'bob' );

	// bob merges q1+q2 (content), then keeps editing what is now survivor
	// content — pipelined on his own merge.
	bob.author( IntentTypes.MERGE_BLOCKS, {
		survivorId: 'q1',
		absorbedId: 'q2',
		field: 'content',
		joinOffset: 18,
	} );
	bob.author( IntentTypes.INSERT_TEXT, {
		syncId: 'q1',
		field: 'content',
		offset: 20,
		text: '!',
	} );
	// alice concurrently deletes q2 — bob's merge will escalate
	// (target-deleted), and his follow-up insert depends on it.
	alice.author( IntentTypes.REMOVE_BLOCK, { syncId: 'q2' } );
	flushClient( server, alice.client );

	const report = flushClient( server, bob.client );
	for ( const row of report ) {
		assert.deepEqual( row.predicted, row.actual, row.intentId );
	}
	assert.deepEqual( report[ 0 ].actual, {
		status: 'escalated',
		reason: 'target-deleted',
	} );
	assert.deepEqual( report[ 1 ].actual, {
		status: 'escalated',
		reason: 'dependent-on-escalated',
	} );
} );

test( 'client prediction stays exact through offline multi-field divergence', () => {
	const server = createServer( baseDoc() );
	const alice = makeActorClient( 'alice' );
	const bob = makeActorClient( 'bob' );

	// alice, online: rewrites q1 content, edits q2 citation, syncs.
	alice.author( IntentTypes.REPLACE_ATTR_CONTENT, {
		syncId: 'q1',
		field: 'content',
		newText: 'New content.',
		observedVersion: 0,
	} );
	alice.author( IntentTypes.INSERT_TEXT, {
		syncId: 'q2',
		field: 'citation',
		offset: 0,
		text: 'Lord ',
	} );
	flushClient( server, alice.client );

	// bob, offline: touches every field of both quotes.
	bob.author( IntentTypes.INSERT_TEXT, {
		syncId: 'q1',
		field: 'content',
		offset: 0,
		text: 'x',
	} ); // hits the rewrite → escalates
	bob.author( IntentTypes.INSERT_TEXT, {
		syncId: 'q1',
		field: 'citation',
		offset: 0,
		text: 'by ',
	} ); // different field → applies
	bob.author( IntentTypes.DELETE_TEXT, {
		syncId: 'q2',
		field: 'citation',
		start: 0,
		end: 3,
		removedText: 'Pol',
	} ); // same field as alice's insert, disjoint after shift → applies
	const report = flushClient( server, bob.client );
	for ( const row of report ) {
		assert.deepEqual( row.predicted, row.actual, row.intentId );
	}
	assert.deepEqual(
		report.map( ( row ) => row.actual.status ),
		[ 'escalated', 'applied', 'applied' ]
	);
	const doc = headDoc( server );
	assert.equal(
		getBlock( doc, 'q1' ).fields.citation.text,
		'by Shakespeare'
	);
	assert.equal( getBlock( doc, 'q2' ).fields.citation.text, 'Lord onius' );
	assert.equal( canonicalJson( bob.client.doc ), canonicalJson( doc ) );
	assert.equal( predictedDisposition( bob.client, 'bob#0' ), null );
} );
