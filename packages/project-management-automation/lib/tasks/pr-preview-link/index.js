
/**
 * Internal dependencies
 */
const debug = require( '../../debug' );

/** @typedef {ReturnType<import('@actions/github').getOctokit>} GitHub */
/** @typedef {import('@octokit/webhooks').WebhookPayloadPullRequest} WebhookPayloadPullRequest */

/**
 * Adds a comment to new PRs with a link to the corresponding gutenberg.run preview site.
 *
 * @param {WebhookPayloadPullRequest} payload Pull request event payload.
 * @param {GitHub}                    octokit Initialized Octokit REST client.
 */
async function prPreviewLink( payload, octokit ) {
	const repo = payload.repository.name;
	const owner = payload.repository.owner.login;
	const pullRequestNumber = payload.pull_request.number;

	const workflowRun = payload?.workflow_run
    const repoHtmlUrl = payload?.repository?.html_url
    const checkSuiteNumber = workflowRun?.check_suite_id
    const artifactsUrl = workflowRun?.artifacts_url

	debug( JSON.stringify( {workflowRun, repoHtmlUrl, checkSuiteNumber, artifactsUrl}) );
	
	debug( 'artifacts: detail data.' );
	// Retrieve artifacts for a specific workflow run
	const getArtifacts = async (owner, repo, runId) => {
		try {
		const response = await octokit.rest.actions.listWorkflowRunArtifacts({
			owner,
			repo,
			run_id: runId,
		});
	
		// Parse the response and extract the download URL or other information
		const artifacts = response.data.artifacts;
		// ... process the artifacts as needed
	
		return artifacts;
		} catch (error) {
		console.error("Error retrieving artifacts:", error);
		throw error;
		}
	};
	
	const runId = 6035878166;
	
	const artifacts = await getArtifacts("WordPress", repo, runId)
	debug(Object.keys(artifacts).toString());

	debug( 'pr-preview-link: Adding comment to PR.' );
	await octokit.rest.issues.createComment( {
		owner,
		repo,
		issue_number: pullRequestNumber,
		body:
			'Preview site for this PR: http://gutenberg.run/' +
			pullRequestNumber,
	} );
}

module.exports = prPreviewLink;
