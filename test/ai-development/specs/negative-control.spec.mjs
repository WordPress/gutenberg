/**
 * Negative control: a trivial task must not trigger skill or doc reads. The
 * progressive-discovery routing in AGENTS.md is only acceptable if agents
 * apply it selectively — this test catches over-reading regressions when the
 * routing wording changes.
 *
 * Spawns a real agent session. Run only via `npm run test:ai-development`.
 */

/**
 * External dependencies
 */
import { test, expect } from '@playwright/test';

/**
 * Internal dependencies
 */
import { runAgent } from '../agent.mjs';

test( 'a trivial task reads no skills or contributor guides', async () => {
	const transcript = runAgent(
		"If the word 'seperate' (a misspelling of 'separate') appears anywhere in CONTRIBUTING.md, fix it; if it does not appear, just say so.",
		{ name: 'negative-control' }
	);

	// Expect no reads from these entire directories…
	expect
		.soft( transcript.reads.filter( ( r ) => r.startsWith( 'skills/' ) ) )
		.toEqual( [] );
	expect
		.soft(
			transcript.reads.filter( ( r ) =>
				r.startsWith( 'docs/contributors/code/e2e/' )
			)
		)
		.toEqual( [] );

	// …and none of this specific guide.
	expect
		.soft( transcript.reads )
		.not.toContain( 'docs/contributors/code/coding-guidelines.md' );
} );
