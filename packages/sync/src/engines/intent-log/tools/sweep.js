/**
 * Long-running oracle sweep, beyond what the test suite runs per commit.
 *
 *   node tools/sweep.js [seedCount] [steps] [clients]
 *
 * Runs `seedCount` seeded schedules (seeds 1..N) at `steps` steps each and
 * fails loudly on any oracle violation. Prints disposition and escalation
 * statistics so escalation-rate drift is visible run over run. Fully
 * deterministic: same arguments → same output.
 */

import { runSimulation } from '../simulator.js';

const seedCount = Number( process.argv[ 2 ] ?? 60 );
const steps = Number( process.argv[ 3 ] ?? 400 );
const clientCount = Number( process.argv[ 4 ] ?? 3 );

let failures = 0;
let intents = 0;
let logEntries = 0;
const statuses = { applied: 0, voided: 0, escalated: 0 };
const reasons = new Map();

for ( let seed = 1; seed <= seedCount; seed++ ) {
	const { server, authored, violations } = runSimulation( {
		seed,
		steps,
		clientCount,
		// Sweeps are not frozen artifacts: run the full vocabulary,
		// including the entity property family.
		propertyOps: true,
	} );
	intents += authored.size;
	logEntries += server.log.length;
	for ( const disposition of server.dispositions.values() ) {
		statuses[ disposition.status ]++;
		if ( disposition.status !== 'applied' ) {
			const key = `${ disposition.status }:${ disposition.reason }`;
			reasons.set( key, ( reasons.get( key ) ?? 0 ) + 1 );
		}
	}
	if ( violations.length > 0 ) {
		failures++;
		console.error( `seed ${ seed }: ${ violations.length } violations` );
		for ( const violation of violations.slice( 0, 5 ) ) {
			console.error( `  - ${ violation }` );
		}
	}
}

const total = statuses.applied + statuses.voided + statuses.escalated;
console.log(
	`${ seedCount } seeds × ${ steps } steps × ${ clientCount } clients: ` +
		`${ intents } intents authored, ${ logEntries } accepted`
);
console.log(
	`dispositions: ${ statuses.applied } applied (${ (
		( 100 * statuses.applied ) /
		total
	).toFixed( 1 ) }%), ${ statuses.escalated } escalated (${ (
		( 100 * statuses.escalated ) /
		total
	).toFixed( 1 ) }%), ${ statuses.voided } voided`
);
for ( const [ reason, count ] of [ ...reasons ].sort(
	( a, b ) => b[ 1 ] - a[ 1 ]
) ) {
	console.log( `  ${ reason }: ${ count }` );
}
if ( failures > 0 ) {
	console.error( `\n${ failures } seed(s) violated oracles` );
	process.exit( 1 );
}
console.log( 'all oracles green' );
