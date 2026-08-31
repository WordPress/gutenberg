// @ts-check

/**
 * The `check` subcommand: stamps one PR head with its freshness status.
 */
import {
	TAG_REF,
	git,
	fail,
	fetchTag,
	resolveBaseline,
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
	await fetchTag();
	await git.fetch( [ '--no-tags', 'origin', headSha ] );

	/* Deepen until a merge base is computable or history is complete. */
	for (;;) {
		try {
			await git.raw( [ 'merge-base', TAG_REF, headSha ] );
			break;
		} catch {
			const shallow = (
				await git.raw( [ 'rev-parse', '--is-shallow-repository' ] )
			).trim();
			if ( shallow !== 'true' ) {
				break;
			}
			await git.fetch( [
				'--no-tags',
				'--deepen=500',
				'origin',
				'trunk',
				headSha,
			] );
		}
	}

	// Re-read the tag just before deciding to shrink the tag-move race window.
	await fetchTag();
	const baseline = await resolveBaseline();
	const fresh = await isAncestor( baseline, headSha );
	const { state, description } = statusFor( fresh, baseline );

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
