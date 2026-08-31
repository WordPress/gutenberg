// @ts-check

/**
 * The `move-baseline` subcommand: moves (or seeds) the baseline tag when
 * markers changed or a move is forced, then optionally fans out.
 */
import {
	TAG,
	MARKER_PATHS,
	FORCE_LABEL,
	REPO,
	git,
	fail,
	graphql,
	fetchTag,
	resolveBaseline,
	isAncestor,
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
 * Moves (or seeds) the baseline tag when markers changed or a move is forced.
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
			await git.raw( [ 'tag', TAG, head ] );
			await git.push( [ 'origin', TAG ] );
		}
		// A dry-run seed creates no tag; the fan-out would have nothing to read.
		if ( thenFanout && ! dryRun ) {
			await fanout( { ...options, mode: 'flip', bootstrapWindow: 0 } );
		}
		return;
	}

	const baseline = await resolveBaseline();
	let move = force === 'true';
	if ( ! move ) {
		/* Diff cumulatively from the baseline so coalesced pushes lose nothing. */
		const changed = await git.raw( [
			'diff',
			'--name-only',
			`${ baseline }..HEAD`,
			'--',
			...MARKER_PATHS,
		] );
		move = changed.trim() !== '';
	}
	if ( ! move ) {
		move = await hasLabeledMergeSince( baseline );
	}
	if ( ! move ) {
		console.log(
			'No marker changes or labeled merges since the baseline; not moving.'
		);
		return;
	}

	const head = ( await git.revparse( [ 'HEAD' ] ) ).trim();
	if ( baseline === head ) {
		console.log( 'Baseline already points at HEAD.' );
		return;
	}
	if ( ! ( await isAncestor( baseline, head ) ) ) {
		return fail(
			`Refusing to move the baseline: ${ head } does not descend from ${ baseline }.`
		);
	}

	console.log( `Moving baseline: ${ baseline } -> ${ head }` );
	if ( ! dryRun ) {
		await git.raw( [ 'tag', '--force', TAG, head ] );
		await git.push( [ 'origin', TAG, '--force' ] );
	}
	if ( thenFanout ) {
		await fanout( { ...options, mode: 'flip', bootstrapWindow: 0 } );
	}
}
