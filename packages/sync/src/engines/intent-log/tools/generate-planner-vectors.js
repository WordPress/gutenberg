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
import { serverDocAt } from '../rebase.js';
import { runSimulation } from '../simulator.js';

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
