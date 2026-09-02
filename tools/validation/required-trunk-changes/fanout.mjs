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
	NO_BASELINE_STATUS,
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
 * Brings every open PR's status in line with the current baseline.
 *
 * @param {CommandOptions} options Command options.
 */
export async function fanout( { dryRun } ) {
	const baseline = await getBaseline();
	/* A description names its baseline, so it identifies the current verdict. */
	const current =
		baseline === null
			? [ NO_BASELINE_STATUS.description ]
			: [
					statusFor( true, baseline ).description,
					statusFor( false, baseline ).description,
			  ];

	const prs = await listOpenPRs();
	console.log(
		`Baseline ${ baseline ?? 'none' }; ${ prs.length } open PRs.`
	);

	let written = 0;
	let skipped = 0;
	let failed = 0;
	let budgetExhausted = false;

	for ( const pr of prs ) {
		if ( pr.status && current.includes( pr.status.description ) ) {
			skipped++;
			continue;
		}
		/* With no baseline nothing is required, so only clear stale verdicts. */
		if ( baseline === null && ! pr.status ) {
			skipped++;
			continue;
		}
		const { state, description } =
			baseline === null
				? NO_BASELINE_STATUS
				: statusFor(
						await isAncestor( baseline, pr.headRefOid ),
						baseline
				  );
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
