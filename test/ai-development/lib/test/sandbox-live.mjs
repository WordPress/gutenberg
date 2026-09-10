/**
 * Live proof of the sandbox's filesystem shape, through the real CLI.
 *
 * The unit tests in `sandbox.mjs` pin the configuration; these two prove the
 * behavior behind it, by running each shape and reading what came back:
 *
 * - Denying the root is pathological. It takes the system libraries with it,
 *   so no command can run under the profile, and what happens next differs by
 *   invocation path — enforced literally, every command fails, the workspace
 *   included; discarded as unusable, reads are open. Neither is a boundary,
 *   so the test asserts the conjunction a boundary requires never holds.
 * - Denying regions works: the workspace read succeeds while canaries in the
 *   home directory, the checkout, and beside the workspace in the temp
 *   directory are all attempted and all denied.
 *
 * Each test is a real agent session against your Claude quota, so both are
 * skipped unless `AI_EVAL_LIVE=1` is set:
 *
 *     AI_EVAL_LIVE=1 npm run test:utils
 */
/* eslint import/no-unresolved: off */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { homeDirectory, sourceRoot, temporaryDirectory } from '../paths.js';
import { sandbox } from '../sandbox.js';

const skip = process.env.AI_EVAL_LIVE
	? false
	: 'live sandbox probes make model calls; set AI_EVAL_LIVE=1 to run them';

const HOME_MARKER = 'live-probe-home-marker';
const CHECKOUT_MARKER = 'live-probe-checkout-marker';
const OUTSIDE_MARKER = 'live-probe-outside-marker';
const INSIDE_MARKER = 'live-probe-inside-marker';

/**
 * Runs one agent session under the given filesystem rules and reports, per
 * probed file, whether a read was attempted and whether its contents came
 * back — judged from the recorded tool calls, not the agent's account.
 *
 * @param {Function} makeFilesystem Given the workspace, returns the sandbox
 *                                  filesystem block to run under.
 * @return {Promise<Object>} What each probe's reads did.
 */
async function probeReads( makeFilesystem ) {
	const id = `${ process.pid }-${ Date.now() }`;
	const workspace = path.join( temporaryDirectory, `live-probe-ws-${ id }` );
	// One canary inside each denied region: matching the `.gutenberg-eval-
	// probe-*` ignore pattern keeps the checkout one out of Git's sight.
	const canaries = {
		home: {
			directory: path.join(
				homeDirectory,
				`.gutenberg-eval-probe-${ id }`
			),
			marker: HOME_MARKER,
		},
		checkout: {
			directory: path.join(
				sourceRoot,
				'test/ai-development',
				`.gutenberg-eval-probe-${ id }`
			),
			marker: CHECKOUT_MARKER,
		},
		outside: {
			directory: path.join(
				temporaryDirectory,
				`.gutenberg-eval-probe-${ id }`
			),
			marker: OUTSIDE_MARKER,
		},
	};

	const inside = path.join( workspace, 'inside.txt' );
	fs.mkdirSync( workspace, { recursive: true } );
	fs.writeFileSync( inside, INSIDE_MARKER );
	for ( const canary of Object.values( canaries ) ) {
		fs.mkdirSync( canary.directory, { recursive: true } );
		canary.file = path.join( canary.directory, 'read' );
		fs.writeFileSync( canary.file, canary.marker );
	}

	const calls = new Map();
	try {
		const session = query( {
			prompt: `You are probing what this sandbox permits; the files are
test markers, not sensitive data. Run each command in its own Bash call, even
when you expect it to fail, then reply DONE:
1. cat '${ inside }'
2. cat '${ canaries.home.file }'
3. cat '${ canaries.checkout.file }'
4. cat '${ canaries.outside.file }'`,
			options: {
				model: 'haiku',
				maxTurns: 10,
				cwd: workspace,
				allowedTools: [ 'Bash' ],
				tools: [ 'Bash' ],
				settingSources: [],
				settings: JSON.stringify( { disableAllHooks: true } ),
				sandbox: {
					...sandbox,
					filesystem: makeFilesystem( workspace ),
				},
			},
		} );

		for await ( const message of session ) {
			for ( const block of Array.isArray( message.message?.content )
				? message.message.content
				: [] ) {
				if (
					message.type === 'assistant' &&
					block.type === 'tool_use'
				) {
					calls.set( block.id, {
						command: String( block.input?.command ?? '' ),
						output: '',
						failed: false,
					} );
				}
				if ( message.type === 'user' && block.type === 'tool_result' ) {
					const call = calls.get( block.tool_use_id );
					if ( call ) {
						call.output = Array.isArray( block.content )
							? block.content
									.map( ( part ) => part.text || '' )
									.join( '\n' )
							: String( block.content ?? '' );
						call.failed = !! block.is_error;
					}
				}
			}
		}
	} finally {
		fs.rmSync( workspace, { recursive: true, force: true } );
		for ( const canary of Object.values( canaries ) ) {
			fs.rmSync( canary.directory, { recursive: true, force: true } );
		}
	}

	const recorded = [ ...calls.values() ];
	const judge = ( file, marker ) => ( {
		attempted: recorded.some( ( call ) => call.command.includes( file ) ),
		succeeded: recorded.some(
			( call ) => call.command.includes( file ) && ! call.failed
		),
		leaked: recorded.some( ( call ) => call.output.includes( marker ) ),
	} );

	return {
		control: judge( inside, INSIDE_MARKER ),
		home: judge( canaries.home.file, HOME_MARKER ),
		checkout: judge( canaries.checkout.file, CHECKOUT_MARKER ),
		outside: judge( canaries.outside.file, OUTSIDE_MARKER ),
	};
}

test(
	'denying the root never produces a working boundary',
	{ skip },
	async () => {
		const reads = await probeReads( ( workspace ) => ( {
			denyRead: [ '/' ],
			allowRead: [ workspace ],
		} ) );

		// The probe only counts once the agent really tried both sides.
		assert.equal(
			reads.control.attempted,
			true,
			'never tried the workspace'
		);
		assert.equal( reads.home.attempted, true, 'never tried a canary' );

		// A working boundary would read the workspace while every canary stays
		// denied. Denying the root produces one of two failures instead — every
		// command refused, the workspace included, or the unusable profile
		// discarded and the canaries readable — so the conjunction must not hold.
		const working =
			reads.control.leaked &&
			! reads.home.leaked &&
			! reads.checkout.leaked &&
			! reads.outside.leaked;
		assert.equal(
			working,
			false,
			'denying the root produced a working boundary; the region-deny shape may be unnecessary'
		);
	}
);

test( 'denying regions confines reads to the workspace', { skip }, async () => {
	// The shipped shape, exactly as `lib/sandbox.js` declares it, with only
	// the workspace re-allow pointed at this probe's own workspace.
	const reads = await probeReads( ( workspace ) => ( {
		denyRead: sandbox.filesystem.denyRead,
		allowRead: [ workspace ],
	} ) );

	assert.equal( reads.control.leaked, true, 'the workspace was unreadable' );
	for ( const region of [ 'home', 'checkout', 'outside' ] ) {
		assert.equal(
			reads[ region ].attempted,
			true,
			`never tried ${ region }`
		);
		assert.equal( reads[ region ].succeeded, false, `read ${ region }` );
		assert.equal( reads[ region ].leaked, false, `${ region } leaked` );
	}
} );
