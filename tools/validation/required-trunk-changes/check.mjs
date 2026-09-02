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
/** @typedef {import('./types.mjs').StatusPayload} StatusPayload */

/**
 * Builds the status payload for a head commit against the baseline.
 *
 * @param {string | null} baseline Baseline commit SHA, if any.
 * @param {string}        headSha  Head commit SHA.
 * @return {Promise<StatusPayload>} Status state and description.
 */
async function evaluate( baseline, headSha ) {
	/* No baseline means nothing is required of open PRs yet. */
	if ( baseline === null ) {
		return { state: 'success', description: 'No required trunk changes.' };
	}
	return statusFor( await isAncestor( baseline, headSha ), baseline );
}

/**
 * Checks one PR head against the baseline and stamps its status.
 *
 * @param {CommandOptions} options Command options.
 */
export async function check( { headSha, dryRun } ) {
	if ( ! headSha ) {
		return fail( 'The check subcommand requires --head-sha.' );
	}
	let baseline = await getBaseline();
	let payload = await evaluate( baseline, headSha );

	// Re-read the baseline just before posting to shrink the move race window.
	const latest = await getBaseline();
	if ( latest !== baseline ) {
		baseline = latest;
		payload = await evaluate( baseline, headSha );
	}

	const { state, description } = payload;

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
		`Posted ${ state } for ${ headSha } against baseline ${
			baseline ?? 'none'
		}.`
	);
}
