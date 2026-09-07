// @ts-check

/**
 * The `check` subcommand: stamps one PR head with its required changes status.
 */
import {
	fail,
	getBaseline,
	isAncestor,
	statusFor,
	latestStatus,
	postStatus,
} from './utils.mjs';

/** @typedef {import('./types.mjs').CommandOptions} CommandOptions */

/**
 * Checks one PR head against the baseline and stamps its status.
 *
 * @param {CommandOptions} options Command options.
 */
export async function check( { headSha, dryRun } ) {
	if ( ! headSha ) {
		return fail( 'The check subcommand requires --head-sha.' );
	}
	let baseline = /** @type {string} */ ( await getBaseline() );
	let includesBaseline = await isAncestor( baseline, headSha );

	// Re-read the baseline just before posting to shrink the move race window.
	const latest = /** @type {string} */ ( await getBaseline() );
	if ( latest !== baseline ) {
		baseline = latest;
		includesBaseline = await isAncestor( baseline, headSha );
	}

	const { state, description } = statusFor( includesBaseline, baseline );

	/* Statuses are append-only and capped per SHA/context; skip no-op writes. */
	const current = await latestStatus( headSha );
	if (
		current &&
		current.state === state.toUpperCase() &&
		current.description === description
	) {
		console.log( `Status already current (${ state }); skipping write.` );
		return;
	}
	await postStatus( headSha, state, description, dryRun );
	console.log(
		`Posted ${ state } for ${ headSha } against baseline ${ baseline }.`
	);
}
