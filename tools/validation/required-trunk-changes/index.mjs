// @ts-check

/**
 * Required trunk changes tooling: a movable tag (`required-trunk-baseline`)
 * marks the last trunk commit every open PR must contain; statuses embed that
 * SHA to expose staleness.
 */
import { parseArgs } from 'node:util';
import { fail, hasCredentials } from './utils.mjs';
import { check } from './check.mjs';
import { moveBaseline } from './move-baseline.mjs';
import { fanout } from './fanout.mjs';

/** @typedef {import('./types.mjs').CommandOptions} CommandOptions */

async function main() {
	const { positionals, values } = parseArgs( {
		allowPositionals: true,
		options: {
			'head-sha': { type: 'string' },
			// String, not boolean: a boolean option rejects --force=false.
			force: { type: 'string', default: 'false' },
			'then-fanout': { type: 'boolean', default: false },
			'dry-run': { type: 'boolean', default: false },
		},
	} );

	if ( values.force !== 'true' && values.force !== 'false' ) {
		return fail( '--force accepts only "true" or "false".' );
	}

	/** @type {CommandOptions} */
	const options = {
		headSha: values[ 'head-sha' ],
		force: values.force,
		thenFanout: values[ 'then-fanout' ] ?? false,
		dryRun: values[ 'dry-run' ] ?? false,
	};

	const commands = { check, 'move-baseline': moveBaseline, fanout };
	const command = commands[ positionals[ 0 ] ?? '' ];
	if ( ! command ) {
		return fail(
			'Usage: required-trunk-changes <check|move-baseline|fanout> [flags]'
		);
	}
	// Checked late so usage and flag errors do not require credentials.
	if ( ! hasCredentials() ) {
		return fail( 'GITHUB_REPOSITORY and GITHUB_TOKEN must be set.' );
	}
	return command( options );
}

main().catch( ( error ) => {
	console.error( error );
	process.exit( 1 );
} );
