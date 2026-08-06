/**
 * Generates frozen cross-language planner vectors: complete server-side
 * ingest transcripts the PHP twin must reproduce exactly.
 *
 *   node tools/generate-planner-vectors.js > test-vectors/planner.json
 *
 * Each case records the genesis revision descriptor, every
 * serverIngestBatch call in order, the expected disposition for every
 * intent, the expected proposal list (in order), the final log
 * (transformed accepted intents), and the canonical final document. A twin
 * that replays the batches and matches all of it implements planBatch, the
 * reducer, and the document model correctly — the transcripts exercise the
 * full vocabulary, frame rules, txn units, and idempotent redelivery at
 * the sweep's measured escalation mix.
 *
 * Determinism: everything derives from fixed seeds; regenerating on any
 * machine yields identical output.
 */

import { canonicalJson } from '../document.js';
import { createServer, serverDocAt, serverIngestBatch } from '../rebase.js';
import { makeGenesisDoc, runSimulation } from '../simulator.js';
import { createIntent, IntentTypes } from '../intents.js';
import { genesisSyncId } from '../sync-id.js';

const CASES = [];

// Simulator transcripts across client counts and agent rates. The
// property-op seeds (propertyOps: true) were added with the entity family;
// the earlier seeds MUST keep propertyOps off — enabling it changes their
// RNG draws and would silently rewrite the pre-entity transcripts.
for ( const [ seed, steps, clientCount, agentChance, propertyOps ] of [
	[ 1, 120, 3, 0.02, false ],
	[ 7, 150, 2, 0, false ],
	[ 9, 150, 3, 0.05, false ],
	[ 23, 200, 4, 0.03, false ],
	[ 42, 100, 3, 0.1, false ],
	[ 65, 180, 5, 0.02, false ],
	[ 101, 150, 3, 0.02, true ],
	[ 137, 200, 4, 0, true ],
	[ 151, 120, 2, 0.05, true ],
] ) {
	const recorder = [];
	const { server, violations } = runSimulation( {
		seed,
		steps,
		clientCount,
		agentChance,
		propertyOps,
		recorder,
	} );
	if ( violations.length > 0 ) {
		throw new Error(
			`seed ${ seed } violated oracles; refusing to freeze: ${ violations[ 0 ] }`
		);
	}
	CASES.push( {
		name: `simulation seed=${ seed } steps=${ steps } clients=${ clientCount } agents=${ agentChance }${
			propertyOps ? ' props=on' : ''
		}`,
		genesis: { postId: 10, revisionId: 100 },
		batches: recorder,
		expected: {
			dispositions: Object.fromEntries( server.dispositions ),
			proposals: server.proposals.map( ( proposal ) => ( {
				intentId: proposal.intent.intentId,
				actorId: proposal.actorId,
				reason: proposal.reason,
			} ) ),
			log: server.log,
			finalDoc: JSON.parse(
				canonicalJson( serverDocAt( server, server.log.length ) )
			),
		},
	} );
}

/*
 * Hand-authored geometry case: rule-2 range escalations at exact
 * boundaries, apply-time void reasons, the merge-absorption escalation,
 * and intra-batch duplicate idempotency — all over MULTIBYTE (UTF-16
 * code unit) content, so a byte-offset twin cannot pass. The random
 * simulations above reach these paths rarely or never; this case pins
 * each one deterministically.
 */
{
	const revision = { postId: 10, revisionId: 100 };
	const recorder = [];
	const server = createServer( makeGenesisDoc( revision ) );
	server.recorder = recorder;
	const p1 = genesisSyncId( revision, [ 0 ] );
	let counters = 0;
	const ingest = ( actorId, type, payload, options = {} ) => {
		const intent = createIntent( type, payload, {
			actorId,
			baseSeq: options.baseSeq ?? server.log.length,
			intentId: `${ actorId }#${ counters++ }`,
			txnId: options.txnId,
		} );
		if ( options.duplicate ) {
			return serverIngestBatch( server, [ intent, intent ] );
		}
		return serverIngestBatch( server, [ intent ] );
	};

	// Multibyte field: 'café你好niño' = 10 UTF-16 code units (all BMP).
	ingest( 'setup', IntentTypes.REPLACE_ATTR_CONTENT, {
		syncId: p1,
		field: 'content',
		newText: 'café你好niño',
		observedVersion: 0,
	} );

	// Boundary insert at the exact END of multibyte text (offset 10).
	ingest( 'alice', IntentTypes.INSERT_TEXT, {
		syncId: p1,
		field: 'content',
		offset: 10,
		text: ' 结束',
	} );

	// Stale delete ending exactly where the concurrent end-insert landed:
	// clean pass-through, multibyte arithmetic must agree.
	const staleBase = server.log.length - 1;
	ingest(
		'bob',
		IntentTypes.DELETE_TEXT,
		{
			syncId: p1,
			field: 'content',
			start: 8,
			end: 10,
			removedText: 'ño',
		},
		{ baseSeq: staleBase }
	);

	// Split after 'café' (offset 4, a 2-byte-UTF-8 boundary).
	const preSplitBase = server.log.length;
	ingest( 'carol', IntentTypes.SPLIT_BLOCK, {
		syncId: p1,
		field: 'content',
		offset: 4,
		newSyncId: 'carol-tail',
	} );

	// Stale replace CROSSING the split point → range-crosses-split.
	ingest(
		'dan',
		IntentTypes.REPLACE_TEXT,
		{
			syncId: p1,
			field: 'content',
			start: 2,
			end: 6,
			removedText: 'fé你好',
			text: 'X',
		},
		{ baseSeq: preSplitBase }
	);

	// Stale point-intent past the split → remaps into the tail with
	// multibyte offset arithmetic.
	ingest(
		'erin',
		IntentTypes.INSERT_TEXT,
		{
			syncId: p1,
			field: 'content',
			offset: 6,
			text: ' 插入',
		},
		{ baseSeq: preSplitBase }
	);

	// position-in-deleted-range: henry deletes head [1,3); stale ivy
	// inserts at 2 (strictly inside).
	const preHeadDelete = server.log.length;
	ingest( 'henry', IntentTypes.DELETE_TEXT, {
		syncId: p1,
		field: 'content',
		start: 1,
		end: 3,
		removedText: 'af',
	} );
	ingest(
		'ivy',
		IntentTypes.INSERT_TEXT,
		{
			syncId: p1,
			field: 'content',
			offset: 2,
			text: 'x',
		},
		{ baseSeq: preHeadDelete }
	);

	// already-deleted void: stale delete fully inside henry's deletion.
	ingest(
		'grace',
		IntentTypes.DELETE_TEXT,
		{
			syncId: p1,
			field: 'content',
			start: 1,
			end: 2,
			removedText: 'a',
		},
		{ baseSeq: preHeadDelete }
	);

	// concurrent-replace-overlap on the multibyte tail.
	const preTailReplace = server.log.length;
	ingest( 'jack', IntentTypes.REPLACE_TEXT, {
		syncId: 'carol-tail',
		field: 'content',
		start: 0,
		end: 2,
		removedText: '你好',
		text: 'HI',
	} );
	ingest(
		'kate',
		IntentTypes.REPLACE_TEXT,
		{
			syncId: 'carol-tail',
			field: 'content',
			start: 1,
			end: 3,
			removedText: '好 ',
			text: 'Y',
		},
		{ baseSeq: preTailReplace }
	);

	// concurrent-insert-in-range: liam inserts inside the range mia
	// (stale) deletes.
	const preTailInsert = server.log.length;
	ingest( 'liam', IntentTypes.INSERT_TEXT, {
		syncId: 'carol-tail',
		field: 'content',
		offset: 1,
		text: 'Z',
	} );
	ingest(
		'mia',
		IntentTypes.DELETE_TEXT,
		{
			syncId: 'carol-tail',
			field: 'content',
			start: 0,
			end: 2,
			removedText: 'HI',
		},
		{ baseSeq: preTailInsert }
	);

	// Apply-time voids: duplicate root id, NESTED duplicate id (the
	// subtree check), missing parent, and a move cycle.
	ingest( 'noah', IntentTypes.INSERT_BLOCK, {
		block: { syncId: p1, blockType: 'core/paragraph' },
		parentId: null,
		afterSiblingId: null,
	} );
	ingest( 'noah', IntentTypes.INSERT_BLOCK, {
		block: {
			syncId: 'fresh-root',
			blockType: 'core/group',
			children: [ { syncId: 'carol-tail', blockType: 'core/paragraph' } ],
		},
		parentId: null,
		afterSiblingId: null,
	} );
	ingest( 'olivia', IntentTypes.MOVE_BLOCK, {
		syncId: p1,
		newParentId: 'ghost-parent',
		afterSiblingId: null,
	} );
	ingest( 'peter', IntentTypes.MOVE_BLOCK, {
		syncId: p1,
		newParentId: p1,
		afterSiblingId: null,
	} );

	// Merge-absorption policy: quinn merges carol-tail into p1; STALE
	// ruth writes an attr on the absorbed block → target-deleted
	// escalation, never a silent void.
	const preMerge = server.log.length;
	ingest( 'quinn', IntentTypes.MERGE_BLOCKS, {
		survivorId: p1,
		absorbedId: 'carol-tail',
		field: 'content',
		joinOffset: 0,
	} );
	ingest(
		'ruth',
		IntentTypes.SET_ATTR,
		{
			syncId: 'carol-tail',
			key: 'align',
			value: 'wide',
			observedVersion: 0,
		},
		{ baseSeq: preMerge }
	);

	// Intra-batch duplicate intentId: settles ONCE; the log grows by one.
	ingest(
		'sam',
		IntentTypes.INSERT_TEXT,
		{
			syncId: p1,
			field: 'content',
			offset: 0,
			text: 'S',
		},
		{ duplicate: true }
	);

	CASES.push( {
		name: 'scripted multibyte boundary geometry, void reasons, merge absorption, intra-batch idempotency',
		genesis: { postId: revision.postId, revisionId: revision.revisionId },
		batches: recorder,
		expected: {
			dispositions: Object.fromEntries( server.dispositions ),
			proposals: server.proposals.map( ( proposal ) => ( {
				intentId: proposal.intent.intentId,
				actorId: proposal.actorId,
				reason: proposal.reason,
			} ) ),
			log: server.log,
			finalDoc: JSON.parse(
				canonicalJson( serverDocAt( server, server.log.length ) )
			),
		},
	} );
}

process.stdout.write(
	JSON.stringify(
		{
			description:
				'Frozen intent-log planner transcripts. The PHP twin replays every batch through its ingest path and must reproduce all dispositions, proposals, the accepted log, and the canonical final document. Regenerate with tools/generate-planner-vectors.js only alongside a deliberate, versioned engine change.',
			cases: CASES,
		},
		null,
		'\t'
	) + '\n'
);
