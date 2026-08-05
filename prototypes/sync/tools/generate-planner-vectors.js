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

import { canonicalJson } from '../src/document.js';
import { serverDocAt } from '../src/rebase.js';
import { runSimulation } from '../src/simulator.js';

const CASES = [];

// Simulator transcripts across client counts and agent rates.
for ( const [ seed, steps, clientCount, agentChance ] of [
	[ 1, 120, 3, 0.02 ],
	[ 7, 150, 2, 0 ],
	[ 9, 150, 3, 0.05 ],
	[ 23, 200, 4, 0.03 ],
	[ 42, 100, 3, 0.1 ],
	[ 65, 180, 5, 0.02 ],
] ) {
	const recorder = [];
	const { server, violations } = runSimulation( {
		seed,
		steps,
		clientCount,
		agentChance,
		recorder,
	} );
	if ( violations.length > 0 ) {
		throw new Error(
			`seed ${ seed } violated oracles; refusing to freeze: ${ violations[ 0 ] }`
		);
	}
	CASES.push( {
		name: `simulation seed=${ seed } steps=${ steps } clients=${ clientCount } agents=${ agentChance }`,
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
