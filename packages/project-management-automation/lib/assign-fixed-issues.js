/**
 * GitHub dependencies
 */
const { debug } = require( '@actions/core' );

async function assignFixedIssues( context, octokit ) {
	const regex = /(?:close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved):? +(?:\#?|https?:\/\/github\.com\/WordPress\/gutenberg\/issues\/)(\d+)/gi;

	let match;
	while ( ( match = regex.exec( context.payload.pull_request.body ) ) ) {
		const [ , issue ] = match;

		debug( `assign-fixed-issues: Assigning issue #${ issue } to @${ context.payload.pull_request.user.login }` );

		await octokit.issues.addAssignees( {
			owner: context.payload.repository.owner.login,
			repo: context.payload.repository.name,
			issue_number: +issue,
			assignees: [ context.payload.pull_request.user.login ],
		} );

		debug( `assign-fixed-issues: Applying '[Status] In Progress' label to issue #${ issue }` );

		await octokit.issues.addLabels( {
			owner: context.payload.repository.owner.login,
			repo: context.payload.repository.name,
			issue_number: +issue,
			labels: [ '[Status] In Progress' ],
		} );
	}
}

module.exports = assignFixedIssues;
