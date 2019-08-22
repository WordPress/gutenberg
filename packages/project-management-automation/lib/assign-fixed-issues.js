/**
 * Internal dependencies
 */
const debug = require( './debug' );

/**
 * Assigns any issues 'fixed' by a newly opened PR to the author of that PR.
 *
 * @param {Object} payload Pull request event payload, see https://developer.github.com/v3/activity/events/types/#pullrequestevent.
 * @param {Object} octokit Initialized Octokit REST client, see https://octokit.github.io/rest.js/.
 */
async function assignFixedIssues( payload, octokit ) {
	const regex = /(?:close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved):? +(?:\#?|https?:\/\/github\.com\/WordPress\/gutenberg\/issues\/)(\d+)/gi;

	let match;
	while ( ( match = regex.exec( payload.pull_request.body ) ) ) {
		const [ , issue ] = match;

		debug( `assign-fixed-issues: Assigning issue #${ issue } to @${ payload.pull_request.user.login }` );

		await octokit.issues.addAssignees( {
			owner: payload.repository.owner.login,
			repo: payload.repository.name,
			issue_number: +issue,
			assignees: [ payload.pull_request.user.login ],
		} );

		debug( `assign-fixed-issues: Applying '[Status] In Progress' label to issue #${ issue }` );

		await octokit.issues.addLabels( {
			owner: payload.repository.owner.login,
			repo: payload.repository.name,
			issue_number: +issue,
			labels: [ '[Status] In Progress' ],
		} );
	}
}

module.exports = assignFixedIssues;
