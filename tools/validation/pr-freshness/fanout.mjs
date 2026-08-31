// @ts-check

/**
 * The `fanout` subcommand: stamps open PRs in bulk. `flip` fails stale green
 * statuses after a baseline move; `reconcile` recomputes real ancestry.
 */
import {
	CONTEXT,
	REPO,
	git,
	fail,
	graphql,
	fetchTag,
	resolveBaseline,
	isAncestor,
	statusFor,
	postStatus,
} from './utils.mjs';

/** @typedef {import('./types.mjs').CommandOptions} CommandOptions */
/** @typedef {import('./types.mjs').PullRequest} PullRequest */
/** @typedef {import('./types.mjs').StatusPayload} StatusPayload */

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
					mergeable
					updatedAt
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
 * Lists open PRs targeting trunk, with their latest freshness status.
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
				mergeable: node.mergeable,
				updatedAt: node.updatedAt,
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
 * Stamps open PRs: `flip` fails stale greens, `reconcile` recomputes ancestry.
 *
 * @param {CommandOptions} options Command options.
 */
export async function fanout( { mode, dryRun, bootstrapWindow } ) {
	if ( mode !== 'flip' && mode !== 'reconcile' ) {
		return fail(
			'The fanout subcommand requires --mode=flip or --mode=reconcile.'
		);
	}
	await fetchTag();
	const baseline = await resolveBaseline();
	const short = baseline.slice( 0, 7 );
	const cutoff =
		bootstrapWindow > 0
			? Date.now() - bootstrapWindow * 24 * 60 * 60 * 1000
			: 0;

	const prs = await listOpenPRs();
	console.log( `Baseline ${ baseline }; ${ prs.length } open PRs.` );

	let written = 0;
	let skipped = 0;
	let failed = 0;
	let budgetExhausted = false;

	/**
	 * Posts one status and tracks counters.
	 *
	 * @param {PullRequest}   pr      Pull request to stamp.
	 * @param {StatusPayload} payload Status to post.
	 * @return {Promise<boolean>} False when the write budget is exhausted.
	 */
	async function stamp( pr, payload ) {
		try {
			if (
				! ( await postStatus(
					pr.headRefOid,
					payload.state,
					payload.description,
					dryRun
				) )
			) {
				budgetExhausted = true;
				return false;
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
		return true;
	}

	/* Drafts cannot merge and ready_for_review re-stamps them; always skip. */
	const eligible = prs.filter( ( pr ) => ! pr.isDraft );

	if ( mode === 'flip' ) {
		for ( const pr of eligible ) {
			/*
			 * Flip-only skip: a trunk-side change can clear a conflict with no
			 * PR event, so reconcile stamps these. UNKNOWN counts as mergeable.
			 */
			if ( pr.mergeable === 'CONFLICTING' ) {
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
			if ( ! ( await stamp( pr, statusFor( false, baseline ) ) ) ) {
				break;
			}
		}
	} else {
		const targets = eligible.filter(
			( pr ) =>
				pr.status || ! cutoff || Date.parse( pr.updatedAt ) >= cutoff
		);
		for ( let i = 0; i < targets.length && ! budgetExhausted; i += 50 ) {
			const chunk = targets.slice( i, i + 50 );
			/* tree:0 keeps the fetch to commit history only. */
			await git.fetch( [
				'--filter=tree:0',
				'--no-tags',
				'origin',
				...chunk.map(
					( pr ) =>
						`+refs/pull/${ pr.number }/head:refs/remotes/pr/${ pr.number }`
				),
			] );
			for ( const pr of chunk ) {
				const fresh = await isAncestor( baseline, pr.headRefOid );
				const payload = statusFor( fresh, baseline );
				if (
					pr.status &&
					pr.status.state === payload.state.toUpperCase() &&
					pr.status.description === payload.description
				) {
					skipped++;
					continue;
				}
				if ( ! ( await stamp( pr, payload ) ) ) {
					break;
				}
			}
		}
	}

	console.log(
		`Fan-out (${ mode }) done: ${ written } written, ${ skipped } skipped, ${ failed } failed.` +
			( budgetExhausted
				? ' Write budget exhausted; dispatch a reconcile run to continue.'
				: '' )
	);
	// Nonzero exit makes an incomplete or lossy sweep visible in the run list.
	if ( failed > 0 || budgetExhausted ) {
		process.exitCode = 1;
	}
}
