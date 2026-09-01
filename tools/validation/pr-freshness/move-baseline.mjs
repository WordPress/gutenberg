// @ts-check

/**
 * The `move-baseline` subcommand. The baseline moves only through explicit
 * intent: a forced dispatch, or a merged PR carrying the force-refresh label.
 */
import {
	FORCE_LABEL,
	REPO,
	git,
	fail,
	graphql,
	fetchTag,
	resolveBaseline,
	isAncestor,
	updateTagRef,
} from './utils.mjs';
import { fanout } from './fanout.mjs';

/** @typedef {import('./types.mjs').CommandOptions} CommandOptions */

/**
 * Detects a merged, force-labeled PR whose merge commit landed after the
 * baseline; scanned cumulatively so coalesced push runs lose nothing.
 *
 * @param {string} baseline Baseline commit SHA.
 * @return {Promise<boolean>} Whether such a merge exists.
 */
async function hasLabeledMergeSince( baseline ) {
	const [ owner, name ] = REPO.split( '/' );
	const data = await graphql(
		`
			query ($owner: String!, $name: String!, $label: String!) {
				repository(owner: $owner, name: $name) {
					pullRequests(
						labels: [$label]
						states: MERGED
						baseRefName: "trunk"
						first: 50
						orderBy: { field: UPDATED_AT, direction: DESC }
					) {
						nodes {
							mergeCommit {
								oid
							}
						}
					}
				}
			}
		`,
		{ owner, name, label: FORCE_LABEL }
	);
	for ( const node of data.repository.pullRequests.nodes ) {
		const oid = node.mergeCommit?.oid;
		if ( ! oid || oid === baseline ) {
			continue;
		}
		if (
			( await isAncestor( baseline, oid ) ) &&
			( await isAncestor( oid, 'HEAD' ) )
		) {
			return true;
		}
	}
	return false;
}

/**
 * Moves (or seeds) the baseline tag when a move is forced or labeled.
 *
 * @param {CommandOptions} options Command options.
 */
export async function moveBaseline( options ) {
	const { force, thenFanout, dryRun } = options;

	if ( ! ( await fetchTag( false ) ) ) {
		if ( force !== 'true' ) {
			console.log(
				'No baseline tag exists and no --force; not seeding.'
			);
			return;
		}
		const head = ( await git.revparse( [ 'HEAD' ] ) ).trim();
		console.log( `Seeding baseline at ${ head }.` );
		if ( ! dryRun ) {
			await updateTagRef( head, true );
		}
		// A dry-run seed creates no tag; the fan-out would have nothing to read.
		if ( thenFanout && ! dryRun ) {
			await fanout( options );
		}
		return;
	}

	const baseline = await resolveBaseline();
	const move = force === 'true' || ( await hasLabeledMergeSince( baseline ) );
	if ( ! move ) {
		console.log(
			'No forced move or labeled merges since the baseline; not moving.'
		);
		return;
	}

	const head = ( await git.revparse( [ 'HEAD' ] ) ).trim();
	if ( baseline === head ) {
		/* Re-dispatch retry path: still fan out to flip any stale survivors. */
		console.log( 'Baseline already points at HEAD.' );
	} else {
		if ( ! ( await isAncestor( baseline, head ) ) ) {
			return fail(
				`Refusing to move the baseline: ${ head } does not descend from ${ baseline }.`
			);
		}
		console.log( `Moving baseline: ${ baseline } -> ${ head }` );
		if ( ! dryRun ) {
			await updateTagRef( head, false );
		}
	}
	if ( thenFanout ) {
		await fanout( options );
	}
}
