// @ts-check

/**
 * The `fanout` subcommand: brings every open PR's required changes status up
 * to date with the current baseline, stamping PRs that carry no status yet.
 */
import {
	CONTEXT,
	REPO,
	graphql,
	getBaseline,
	isAncestor,
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
					commits(last: 1) {
						nodes {
							commit {
								committedDate
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
			const commit = node.commits.nodes[ 0 ]?.commit;
			prs.push( {
				number: node.number,
				headRefOid: node.headRefOid,
				committedDate: commit?.committedDate ?? null,
				status: commit?.status?.context ?? null,
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
 * Reads a commit's date, used as a cheap ancestry bound.
 *
 * @param {string} oid Commit SHA.
 * @return {Promise<string>} Commit date, ISO 8601.
 */
async function commitDate( oid ) {
	const [ owner, name ] = REPO.split( '/' );
	const data = await graphql(
		`
			query ($owner: String!, $name: String!, $oid: GitObjectID!) {
				repository(owner: $owner, name: $name) {
					object(oid: $oid) {
						... on Commit {
							committedDate
						}
					}
				}
			}
		`,
		{ owner, name, oid }
	);
	return data.repository.object.committedDate;
}

/**
 * Brings every open PR's status in line with the current baseline.
 *
 * @param {CommandOptions} options Command options.
 */
export async function fanout( { dryRun } ) {
	const baseline = await getBaseline();
	if ( baseline === null ) {
		console.log( 'No baseline tag; nothing to fan out.' );
		return;
	}
	const short = baseline.slice( 0, 7 );
	const baselineDate = await commitDate( baseline );

	const prs = await listOpenPRs();
	console.log( `Baseline ${ baseline }; ${ prs.length } open PRs.` );

	let written = 0;
	let skipped = 0;
	let failed = 0;
	let budgetExhausted = false;

	for ( const pr of prs ) {
		/* Both descriptions embed the baseline; anything else needs a stamp. */
		if ( pr.status?.description?.includes( short ) ) {
			skipped++;
			continue;
		}
		/*
		 * A head committed before the baseline cannot contain it, which spares
		 * a compare call for all but the PRs updated since the baseline moved.
		 */
		const includesBaseline =
			pr.committedDate && pr.committedDate < baselineDate
				? false
				: await isAncestor( baseline, pr.headRefOid );
		const { state, description } = statusFor( includesBaseline, baseline );
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
