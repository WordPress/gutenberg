'use strict';

/** @typedef {import('@octokit/rest')} GitHub */
/** @typedef {import('@octokit/rest').IssuesListMilestonesForRepoResponseItem} OktokitIssuesListMilestonesForRepoResponseItem */
/** @typedef {import('@octokit/rest').IssuesListForRepoResponseItem} IssuesListForRepoResponseItem */
/** @typedef {import('./cli').WPChangelogSettings} WPChangelogSettings */

/**
 * Returns a promise resolving to a milestone by a given title, if exists.
 *
 * @param {GitHub} octokit Initialized Octokit REST client.
 * @param {string} owner   Repository owner.
 * @param {string} repo    Repository name.
 * @param {string} title   Milestone title.
 *
 * @return {Promise<OktokitIssuesListMilestonesForRepoResponseItem|void>} Promise resolving to milestone, if exists.
 */
async function getMilestoneByTitle( octokit, owner, repo, title ) {
	const options = octokit.issues.listMilestonesForRepo.endpoint.merge( {
		owner,
		repo,
	} );

	/**
	 * @type {AsyncIterableIterator<import('@octokit/rest').Response<import('@octokit/rest').IssuesListMilestonesForRepoResponse>>}
	 */
	const responses = octokit.paginate.iterator( options );

	for await ( const response of responses ) {
		const milestones = response.data;
		for ( const milestone of milestones ) {
			if ( milestone.title === title ) {
				return milestone;
			}
		}
	}
}

/**
 * Returns a promise resolving to pull requests by a given milestone ID.
 *
 * @param {GitHub} octokit   Initialized Octokit REST client.
 * @param {string} owner     Repository owner.
 * @param {string} repo      Repository name.
 * @param {number} milestone Milestone ID.
 *
 * @return {Promise<IssuesListForRepoResponseItem[]>} Promise resolving to pull
 *                                                    requests for the given
 *                                                    milestone.
 */
async function getPullRequestsByMilestone( octokit, owner, repo, milestone ) {
	const options = octokit.issues.listForRepo.endpoint.merge( {
		owner,
		repo,
		milestone,
		state: 'closed',
	} );

	/**
	 * @type {AsyncIterableIterator<import('@octokit/rest').Response<import('@octokit/rest').IssuesListForRepoResponse>>}
	 */
	const responses = octokit.paginate.iterator( options );

	const pulls = [];

	for await ( const response of responses ) {
		const issues = response.data;
		for ( const issue of issues ) {
			if ( issue.pull_request ) {
				pulls.push( issue );
			}
		}
	}

	return pulls;
}

/**
 * Returns a promise resolving to an array of pull requests associated with the
 * changelog settings object.
 *
 * @param {GitHub}              octokit  GitHub REST client.
 * @param {WPChangelogSettings} settings Changelog settings.
 *
 * @return {Promise<IssuesListForRepoResponseItem[]>} Promise resolving to array of
 *                                            pull requests.
 */
async function fetchAllPullRequests( octokit, settings ) {
	const { owner, repo, milestone: milestoneTitle } = settings;
	const milestone = await getMilestoneByTitle(
		octokit,
		owner,
		repo,
		milestoneTitle
	);

	if ( ! milestone ) {
		throw new Error(
			`Cannot find milestone by title: ${ settings.milestone }`
		);
	}

	const { number } = milestone;
	return getPullRequestsByMilestone( octokit, owner, repo, number );
}

module.exports = {
	fetchAllPullRequests,
};
