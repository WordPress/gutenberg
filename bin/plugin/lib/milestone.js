/** @typedef {import('@octokit/rest').Octokit} GitHub */
/** @typedef {import('@octokit/types').Endpoints} Endpoints */

/* eslint-disable jsdoc/valid-types */
/** @typedef {import('@octokit/openapi-types').components["schemas"]["issue"]} Issue */
/** @typedef {import('@octokit/openapi-types').components["schemas"]["milestone"]} Milestone */
/* eslint-enable jsdoc/valid-types */

/**
 * @typedef {"open"|"closed"|"all"} IssueState
 */

/**
 * Returns a promise resolving to a milestone by a given title, if exists.
 *
 * @param {GitHub} octokit Initialized Octokit REST client.
 * @param {string} owner   Repository owner.
 * @param {string} repo    Repository name.
 * @param {string} title   Milestone title.
 *
 * @return {Promise<Milestone|undefined>} Promise resolving to milestone, if exists.
 */
async function getMilestoneByTitle( octokit, owner, repo, title ) {
	const responses = octokit.paginate.iterator(
		octokit.issues.listMilestones,
		{ owner, repo }
	);

	for await ( const response of responses ) {
		const milestones = response.data;
		for ( const milestone of milestones ) {
			if ( milestone.title === title ) {
				return milestone;
			}
		}
	}
	return undefined;
}

/**
 * Returns a promise resolving to pull requests by a given milestone ID.
 *
 * @param {GitHub}     octokit       Initialized Octokit REST client.
 * @param {string}     owner         Repository owner.
 * @param {string}     repo          Repository name.
 * @param {number}     milestone     Milestone ID.
 * @param {IssueState} [state]       Optional issue state.
 * @param {string}     [closedSince] Optional timestamp.
 *
 * @return {Promise<Issue[]>} Promise resolving to pull requests for the given
 *                          milestone.
 */
async function getIssuesByMilestone(
	octokit,
	owner,
	repo,
	milestone,
	state,
	closedSince
) {
	const responses = octokit.paginate.iterator( octokit.issues.listForRepo, {
		owner,
		repo,
		milestone,
		state,
		...( closedSince && {
			since: closedSince,
		} ),
	} );

	/**
	 * @type {Issue[]}
	 */
	const pulls = [];

	for await ( const response of responses ) {
		const issues = response.data;
		pulls.push( ...issues );
	}

	if ( closedSince ) {
		const closedSinceTimestamp = new Date( closedSince );

		return pulls.filter(
			( pull ) =>
				pull.closed_at &&
				closedSinceTimestamp < new Date( pull.closed_at )
		);
	}

	return pulls;
}

module.exports = {
	getMilestoneByTitle,
	getIssuesByMilestone,
};
