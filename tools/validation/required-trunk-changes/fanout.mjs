// @ts-check

/**
 * The `fanout` subcommand: after a baseline move, flips open PRs whose
 * passing required changes status references an older baseline to failing.
 */
import {
	CONTEXT,
	REPO,
	graphql,
	getBaseline,
	statusFor,
	postStatus,
} from './utils.mjs';

/** @typedef {import('./types.mjs').CommandOptions} CommandOptions */
/** @typedef {import('./types.mjs').PullRequest} PullRequest */

const PAGE_QUERY = `
	query (
		$owner: String!
		$name: String!
		$cursor: String
		$context: String!
	) {
		repository(owner: $owner, name: $name) {
			pullRequests(
				states: OPEN
				baseRefName: "trunk"
				first: 100
				after: $cursor
				orderBy: { field: UPDATED_AT, direction: DESC }
			) {
				pageInfo {
					hasNextPage
					endCursor
				}
				nodes {
					number
					headRefOid
					isDraft
					commits(last: 1) {
						nodes {
							commit {
								status {
									context(name: $context) {
										state
										description
									}
								}
							}
						}
					}
				}
			}
		}
	}
`;

/**
 * Lists open PRs targeting trunk, with their latest required changes status.
 *
 * @return {Promise<PullRequest[]>} Open pull requests.
 */
async function listOpenPRs() {
	const [ owner, name ] = REPO.split( '/' );
	/** @type {PullRequest[]} */
	const prs = [];
	let cursor = null;
	for (;;) {
		const data = await graphql( PAGE_QUERY, {
			owner,
			name,
			cursor,
			context: CONTEXT,
		} );
		const page = data.repository.pullRequests;
		for ( const node of page.nodes ) {
			prs.push( {
				number: node.number,
				headRefOid: node.headRefOid,
				isDraft: node.isDraft,
				status:
					node.commits.nodes[ 0 ]?.commit?.status?.context ?? null,
			} );
		}
		if ( ! page.pageInfo.hasNextPage ) {
			break;
		}
		cursor = page.pageInfo.endCursor;
	}
	return prs;
}

/**
 * Flips stale passing statuses to failing against the current baseline.
 *
 * @param {CommandOptions} options Command options.
 */
export async function fanout( { dryRun } ) {
	const baseline = /** @type {string} */ ( await getBaseline() );
	const short = baseline.slice( 0, 7 );

	const prs = await listOpenPRs();
	console.log( `Baseline ${ baseline }; ${ prs.length } open PRs.` );

	let written = 0;
	let skipped = 0;
	let failed = 0;
	let budgetExhausted = false;

	for ( const pr of prs ) {
		/* Drafts cannot merge, and ready_for_review re-stamps them. */
		if ( pr.isDraft ) {
			skipped++;
			continue;
		}
		const stale =
			pr.status?.state === 'SUCCESS' &&
			! pr.status.description?.includes( short );
		if ( ! stale ) {
			skipped++;
			continue;
		}
		const { state, description } = statusFor( false, baseline );
		try {
			if (
				! ( await postStatus(
					pr.headRefOid,
					state,
					description,
					dryRun
				) )
			) {
				budgetExhausted = true;
				break;
			}
			written++;
		} catch ( error ) {
			failed++;
			console.error(
				`PR #${ pr.number }: ${
					error instanceof Error ? error.message : error
				}`
			);
		}
	}

	console.log(
		`Fan-out done: ${ written } written, ${ skipped } skipped, ${ failed } failed.` +
			( budgetExhausted
				? ' Write budget exhausted; dispatch the workflow again to continue.'
				: '' )
	);
	// Nonzero exit makes an incomplete or lossy sweep visible in the run list.
	if ( failed > 0 || budgetExhausted ) {
		process.exitCode = 1;
	}
}
