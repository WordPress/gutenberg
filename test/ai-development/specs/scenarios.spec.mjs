/**
 * Verifies that an agent, given each scenario's task prompt, consulted the
 * right guidance: read the skill files and docs it should, didn't read the
 * ones it shouldn't, in the right order, and reached for the right kind of
 * command. Evidence comes from the agent's own transcript.
 *
 * Every test spawns a real agent session (minutes and real tokens). Run only
 * via `npm run test:ai-development` — see ../scenarios/README.md.
 */

/**
 * External dependencies
 */
import { test, expect } from '@playwright/test';

/**
 * Internal dependencies
 */
import { loadScenarios, runAgent, checkAssertions } from '../agent.mjs';

for ( const scenario of loadScenarios() ) {
	if ( ! scenario.assertions ) {
		continue;
	}
	test( scenario.name, async () => {
		test.setTimeout( ( ( scenario.timeoutSeconds ?? 900 ) + 60 ) * 1000 );

		const transcript = runAgent( scenario, {
			model: process.env.AI_EVAL_MODEL,
		} );

		for ( const { label, pass, evidence } of checkAssertions(
			scenario.assertions,
			transcript
		) ) {
			expect
				.soft(
					pass,
					`${ label }\n  actual:\n  ${ evidence
						.slice( 0, 20 )
						.join( '\n  ' ) }\n  transcript: ${
						transcript.artifact
					}`
				)
				.toBe( true );
		}
	} );
}
