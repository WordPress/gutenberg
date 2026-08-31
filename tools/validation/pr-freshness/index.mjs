// @ts-check

/**
 * PR freshness tooling: a movable tag (`infra-baseline`) marks the last trunk
 * commit every open PR must contain; statuses embed that SHA to expose staleness.
 */
import { parseArgs } from 'node:util';
import { fail, hasCredentials } from './utils.mjs';
import { check } from './check.mjs';
import { moveBaseline } from './move-baseline.mjs';
import { fanout } from './fanout.mjs';

/** @typedef {import('./types.mjs').CommandOptions} CommandOptions */

async function main() {
	if ( ! hasCredentials() ) {
		return fail( 'GITHUB_REPOSITORY and GITHUB_TOKEN must be set.' );
	}

	const { positionals, values } = parseArgs( {
		allowPositionals: true,
		options: {
			'head-sha': { type: 'string' },
			// String, not boolean: a boolean option rejects --force=false.
			force: { type: 'string', default: 'false' },
			'then-fanout': { type: 'boolean', default: false },
			mode: { type: 'string' },
			'dry-run': { type: 'boolean', default: false },
			'bootstrap-window': { type: 'string', default: '180' },
		},
	} );

	if ( values.force !== 'true' && values.force !== 'false' ) {
		return fail( '--force accepts only "true" or "false".' );
	}
	const bootstrapWindow = Number( values[ 'bootstrap-window' ] );
	if ( ! Number.isFinite( bootstrapWindow ) || bootstrapWindow < 0 ) {
		return fail(
			'--bootstrap-window must be a non-negative number of days.'
		);
	}

	/** @type {CommandOptions} */
	const options = {
		headSha: values[ 'head-sha' ],
		force: values.force,
		thenFanout: values[ 'then-fanout' ] ?? false,
		mode: values.mode,
		dryRun: values[ 'dry-run' ] ?? false,
		bootstrapWindow,
	};

	switch ( positionals[ 0 ] ) {
		case 'check':
			return check( options );
		case 'move-baseline':
			return moveBaseline( options );
		case 'fanout':
			return fanout( options );
		default:
			return fail(
				'Usage: pr-freshness <check|move-baseline|fanout> [flags]'
			);
	}
}

main().catch( ( error ) => {
	console.error( error );
	process.exit( 1 );
} );
