/**
 * The concurrent-merge matrix: every intent type against every intent type.
 *
 * For each ordered pair (A, B): actor A's intent is accepted first; actor B
 * authored theirs concurrently against the same base and flushes second
 * through a real client. No pair gets a hand-written expected document —
 * instead every pair must uphold the engine's universal guarantees:
 *
 * - termination: both intents end applied, voided (with reason), or
 *   escalated (with a documented reason, present in the proposal lane,
 *   correctly attributed);
 * - determinism: the head document equals a fresh replay of the log;
 * - prediction parity: B's client predicted the server's disposition
 *   exactly;
 * - convergence: B's optimistic and acked replicas equal the head;
 * - verifiable effects: every applied entry's documented effect is visible
 *   at its log position.
 *
 * Curated pairs with exact expected outcomes live in scenarios.test.js and
 * rebase.test.js; this file guarantees the whole surface terminates
 * consistently, including the diagonal (same op twice) and asymmetric
 * orderings.
 */

import assert from 'node:assert/strict';

import { canonicalJson, createDocument } from '../document.js';
import { IntentTypes, createIntent } from '../intents.js';
import { replay } from '../reducer.js';
import { ESCALATION_REASONS, createServer, serverDocAt } from '../rebase.js';
import { authorIntent, createClient, flushClient } from '../client.js';
import { verifyEffect } from '../simulator.js';

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
		{
			// Multi-field block: matrix pairs cover cross-field combinations.
			syncId: 'p3',
			blockType: 'core/quote',
			fields: {
				content: { text: 'Tail' },
				citation: { text: 'Someone' },
			},
		},
	] );

/**
 * Factories keyed by a descriptive name. Each returns the payload for one
 * intent authored against the BASE document. `actor` seeds ids minted by
 * the intent so the two sides never collide on creation-minted ids.
 */
const FACTORIES = {
	'insert_text head': () => [
		IntentTypes.INSERT_TEXT,
		{ syncId: 'p1', offset: 0, text: 'NEW ' },
	],
	'insert_text mid': () => [
		IntentTypes.INSERT_TEXT,
		{ syncId: 'p1', offset: 5, text: '+++' },
	],
	'insert_text nested': () => [
		IntentTypes.INSERT_TEXT,
		{ syncId: 'p2', offset: 2, text: '~' },
	],
	'delete_text left': () => [
		IntentTypes.DELETE_TEXT,
		{ syncId: 'p1', start: 0, end: 5, removedText: 'Hello' },
	],
	'delete_text overlap': () => [
		IntentTypes.DELETE_TEXT,
		{ syncId: 'p1', start: 3, end: 8, removedText: 'lo wo' },
	],
	'replace_text mid': () => [
		IntentTypes.REPLACE_TEXT,
		{ syncId: 'p1', start: 4, end: 7, removedText: 'o w', text: 'OW' },
	],
	'format_text span': () => [
		IntentTypes.FORMAT_TEXT,
		{ syncId: 'p1', start: 2, end: 9, format: 'bold', on: true },
	],
	'split_block mid': ( actor ) => [
		IntentTypes.SPLIT_BLOCK,
		{ syncId: 'p1', offset: 5, newSyncId: `${ actor }-split` },
	],
	'merge_blocks p1p3': () => [
		IntentTypes.MERGE_BLOCKS,
		{ survivorId: 'p1', absorbedId: 'p3', joinOffset: 11 },
	],
	'move into group': () => [
		IntentTypes.MOVE_BLOCK,
		{ syncId: 'p3', newParentId: 'g1', afterSiblingId: 'p2' },
	],
	'move to root': () => [
		IntentTypes.MOVE_BLOCK,
		{ syncId: 'p2', newParentId: null, afterSiblingId: 'p1' },
	],
	'remove_block leaf': () => [ IntentTypes.REMOVE_BLOCK, { syncId: 'p1' } ],
	'remove_block subtree': () => [
		IntentTypes.REMOVE_BLOCK,
		{ syncId: 'g1' },
	],
	'insert_block root': ( actor ) => [
		IntentTypes.INSERT_BLOCK,
		{
			block: { syncId: `${ actor }-new`, blockType: 'core/paragraph' },
			parentId: null,
			afterSiblingId: 'p1',
		},
	],
	'insert_block child': ( actor ) => [
		IntentTypes.INSERT_BLOCK,
		{
			block: { syncId: `${ actor }-child`, blockType: 'core/paragraph' },
			parentId: 'g1',
			afterSiblingId: 'p2',
		},
	],
	'set_attr align': () => [
		IntentTypes.SET_ATTR,
		{ syncId: 'p1', key: 'align', value: 'wide', observedVersion: 0 },
	],
	'remove_attr align': () => [
		IntentTypes.REMOVE_ATTR,
		{ syncId: 'p1', key: 'align', observedVersion: 0 },
	],
	'transform_block heading': () => [
		IntentTypes.TRANSFORM_BLOCK,
		{ syncId: 'p1', newBlockType: 'core/heading' },
	],
	'replace_attr_content p1': () => [
		IntentTypes.REPLACE_ATTR_CONTENT,
		{ syncId: 'p1', newText: 'Rewritten.', observedVersion: 0 },
	],
	'split_block nested': ( actor ) => [
		IntentTypes.SPLIT_BLOCK,
		{ syncId: 'p2', offset: 3, newSyncId: `${ actor }-nsplit` },
	],
	'insert_text citation': () => [
		IntentTypes.INSERT_TEXT,
		{ syncId: 'p3', field: 'citation', offset: 0, text: 'Dr. ' },
	],
	'delete_text p3 content': () => [
		IntentTypes.DELETE_TEXT,
		{ syncId: 'p3', field: 'content', start: 0, end: 2, removedText: 'Ta' },
	],
	'replace_attr citation': () => [
		IntentTypes.REPLACE_ATTR_CONTENT,
		{
			syncId: 'p3',
			field: 'citation',
			newText: 'Anon.',
			observedVersion: 0,
		},
	],
};

const TERMINAL = new Set( [ 'applied', 'voided', 'escalated' ] );

function runPair( nameA, nameB ) {
	const server = createServer( baseDoc() );
	const clientA = createClient( 'alice', baseDoc() );
	const clientB = createClient( 'bob', baseDoc() );
	const [ typeA, payloadA ] = FACTORIES[ nameA ]( 'alice' );
	const [ typeB, payloadB ] = FACTORIES[ nameB ]( 'bob' );

	authorIntent(
		clientA,
		createIntent( typeA, payloadA, {
			actorId: 'alice',
			baseSeq: 0,
			intentId: 'alice#0',
		} )
	);
	authorIntent(
		clientB,
		createIntent( typeB, payloadB, {
			actorId: 'bob',
			baseSeq: 0,
			intentId: 'bob#0',
		} )
	);

	const reportA = flushClient( server, clientA );
	const reportB = flushClient( server, clientB );
	flushClient( server, clientA );
	return { server, clientA, clientB, reportA, reportB };
}

function assertInvariants(
	label,
	{ server, clientA, clientB, reportA, reportB }
) {
	for ( const row of [ ...reportA, ...reportB ] ) {
		assert.ok(
			TERMINAL.has( row.actual.status ),
			`${ label }: ${ row.intentId } lacks a terminal disposition`
		);
		assert.deepEqual(
			row.predicted,
			row.actual,
			`${ label }: ${ row.intentId } prediction diverged`
		);
		if ( row.actual.status !== 'applied' ) {
			assert.ok(
				row.actual.reason,
				`${ label }: ${ row.intentId } non-applied without reason`
			);
		}
		if ( row.actual.status === 'escalated' ) {
			assert.ok(
				ESCALATION_REASONS.has( row.actual.reason ),
				`${ label }: undocumented escalation reason ${ row.actual.reason }`
			);
			const proposal = server.proposals.find(
				( candidate ) => candidate.intent.intentId === row.intentId
			);
			assert.ok(
				proposal,
				`${ label }: escalation missing from proposals`
			);
			assert.equal(
				proposal.actorId,
				row.intentId.startsWith( 'alice' ) ? 'alice' : 'bob',
				`${ label }: proposal misattributed`
			);
		}
	}

	// First mover with no interference always applies.
	assert.deepEqual(
		reportA[ 0 ].actual,
		{ status: 'applied' },
		`${ label }: first intent should apply`
	);

	// Determinism: head equals a fresh replay of the log from genesis.
	const head = serverDocAt( server, server.log.length );
	assert.equal(
		canonicalJson( head ),
		canonicalJson( replay( baseDoc(), server.log ) ),
		`${ label }: head diverges from fresh replay`
	);

	// Convergence: both replicas (acked and optimistic) match the head.
	for ( const client of [ clientA, clientB ] ) {
		assert.equal(
			canonicalJson( client.baseDoc ),
			canonicalJson( head ),
			`${ label }: ${ client.actorId } acked state diverged`
		);
		assert.equal(
			canonicalJson( client.doc ),
			canonicalJson( head ),
			`${ label }: ${ client.actorId } optimistic state diverged`
		);
	}

	// Verifiable effects for every applied log entry.
	for ( let seq = 0; seq < server.log.length; seq++ ) {
		const entry = server.log[ seq ];
		if ( server.dispositions.get( entry.intentId )?.status !== 'applied' ) {
			continue;
		}
		const problem = verifyEffect(
			serverDocAt( server, seq ),
			serverDocAt( server, seq + 1 ),
			entry
		);
		assert.equal( problem, null, `${ label }: ${ problem }` );
	}
}

const names = Object.keys( FACTORIES );
test( `merge matrix: ${ names.length }×${ names.length } ordered pairs uphold every invariant`, () => {
	let escalated = 0;
	let voided = 0;
	for ( const nameA of names ) {
		for ( const nameB of names ) {
			const label = `[${ nameA }] then [${ nameB }]`;
			const result = runPair( nameA, nameB );
			assertInvariants( label, result );
			const status = result.reportB[ 0 ].actual.status;
			if ( status === 'escalated' ) {
				escalated++;
			}
			if ( status === 'voided' ) {
				voided++;
			}
		}
	}
	const total = names.length * names.length;
	// The matrix must stay mostly-mergeable: escalation is the exception
	// lane, not the default outcome. (Exact per-pair outcomes are pinned in
	// scenarios.test.js; this guards against a regression that flips broad
	// classes of merges into escalations or silent voids.)
	assert.ok(
		escalated < total * 0.35,
		`escalation rate too high: ${ escalated }/${ total }`
	);
	assert.ok(
		voided < total * 0.1,
		`void rate too high: ${ voided }/${ total }`
	);
} );

test( 'merge matrix: three-way — every pair with a coarse agent rewrite interleaved', () => {
	for ( const nameB of names ) {
		const label = `[agent rewrite] between [insert_text head] and [${ nameB }]`;
		const server = createServer( baseDoc() );
		const clientA = createClient( 'alice', baseDoc() );
		const clientB = createClient( 'bob', baseDoc() );
		authorIntent(
			clientA,
			createIntent(
				IntentTypes.INSERT_TEXT,
				{ syncId: 'p3', offset: 0, text: 'A: ' },
				{ actorId: 'alice', baseSeq: 0, intentId: 'alice#0' }
			)
		);
		const [ typeB, payloadB ] = FACTORIES[ nameB ]( 'bob' );
		authorIntent(
			clientB,
			createIntent( typeB, payloadB, {
				actorId: 'bob',
				baseSeq: 0,
				intentId: 'bob#0',
			} )
		);
		const reportA = flushClient( server, clientA );
		// A server-side agent rewrites p1 through the same ingest path.
		const agent = createClient( 'agent', baseDoc() );
		agent.log.push( ...server.log );
		agent.cursor = server.log.length;
		agent.baseDoc = serverDocAt( server, server.log.length );
		agent.doc = agent.baseDoc;
		authorIntent(
			agent,
			createIntent(
				IntentTypes.REPLACE_ATTR_CONTENT,
				{ syncId: 'p1', newText: 'Agent.', observedVersion: 0 },
				{ actorId: 'agent', baseSeq: agent.cursor, intentId: 'agent#0' }
			)
		);
		const reportAgent = flushClient( server, agent );
		const reportB = flushClient( server, clientB );
		flushClient( server, clientA );
		flushClient( server, agent );
		assertInvariants( label, {
			server,
			clientA,
			clientB,
			reportA: [ ...reportA, ...reportAgent ],
			reportB,
		} );
	}
} );
