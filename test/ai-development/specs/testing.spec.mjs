/**
 * Verifies agents follow the `skills/testing` skill: read the right guidance,
 * skip the unrelated references, and reach for scoped, headless commands.
 *
 * Every test spawns a real agent session (minutes and real tokens). Run only
 * via `npm run test:ai-development` — see ../README.md.
 */

/**
 * External dependencies
 */
import { test, expect } from '@playwright/test';

/**
 * Internal dependencies
 */
import { runAgent } from '../agent.mjs';

test.describe( 'testing skill', () => {
	test( 'running e2e tests for a block follows the skill', async () => {
		const transcript = runAgent(
			'Run the e2e tests for the paragraph block',
			{ name: 'testing-run-e2e' }
		);
		const e2eCommands = transcript
			.commandsMatching( 'test:e2e' )
			.join( '\n' );

		// Discovery chain: the skill and its e2e reference, not the others.
		expect.soft( transcript.reads ).toContain( 'skills/testing/SKILL.md' );
		expect
			.soft( transcript.reads )
			.toContain( 'skills/testing/references/e2e.md' );
		expect
			.soft( transcript.reads )
			.not.toContain( 'skills/testing/references/php.md' );
		expect
			.soft( transcript.reads )
			.not.toContain( 'skills/testing/references/jest.md' );
		expect
			.soft( transcript.firstRead( 'skills/testing/SKILL.md' ) )
			.toBeLessThan( transcript.firstCommand( 'test:e2e' ) );
		expect
			.soft( transcript.firstRead( 'skills/testing/references/e2e.md' ) )
			.toBeLessThan( transcript.firstCommand( 'test:e2e' ) );

		// Environment checked before started; run scoped and headless.
		expect
			.soft( transcript.firstCommand( 'wp-env-test status' ) )
			.toBeLessThan( transcript.firstCommand( 'wp-env-test start' ) );
		expect.soft( e2eCommands ).toContain( '.spec.js' );
		expect.soft( e2eCommands ).not.toContain( '--headed' );
		expect.soft( e2eCommands ).not.toContain( '--ui' );
		expect.soft( e2eCommands ).not.toContain( '--debug' );
	} );

	test( 'writing an e2e test reads the authoring guide before editing', async () => {
		const transcript = runAgent(
			'Add an e2e test for the paragraph block that checks that the `&` key is not output as `&amp;` in the editor',
			{ name: 'testing-write-e2e' }
		);

		// The skill chain plus the canonical authoring guide it points to.
		expect.soft( transcript.reads ).toContain( 'skills/testing/SKILL.md' );
		expect
			.soft( transcript.reads )
			.toContain( 'skills/testing/references/e2e.md' );
		expect
			.soft( transcript.reads )
			.toContain( 'docs/contributors/code/e2e/README.md' );
		expect
			.soft( transcript.reads )
			.not.toContain( 'skills/testing/references/php.md' );
		expect
			.soft( transcript.reads )
			.not.toContain( 'skills/testing/references/jest.md' );

		// The guide must be consulted before the first attempted spec edit.
		expect
			.soft(
				transcript.firstRead( 'docs/contributors/code/e2e/README.md' )
			)
			.toBeLessThan( transcript.firstWrite() );
	} );
} );
