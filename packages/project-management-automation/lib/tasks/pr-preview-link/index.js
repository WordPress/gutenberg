// @ts-nocheck

/**
 * Internal dependencies
 */
const debug = require( '../../debug' );

/** @typedef {ReturnType<import('@actions/github').getOctokit>} GitHub */
/** @typedef {any} WorkflowRunEvent */

/**
 * Identifier used to find existing comment.
 *
 * @type {string}
 */
const COMMENT_PLACEHOLDER = 'gutenberg-run-placeholder:cmt@v1';

const createBuildSummary = async (
	{ buildStatus, latestCommit, pullRequestNumber, artifact },
	octokit
) => {
	let status, previewMsg, artifactMsg;
	status = previewMsg = artifactMsg = '🚧  Building in progress...';
	if ( buildStatus === 'success' ) {
		status = '✅  Build successful!';
		previewMsg = `🔗 [gutenberg.run/${ pullRequestNumber }](gutenberg.run/${ pullRequestNumber } )`;
		artifactMsg = `📦 [gutenberg-plugin](${ artifact.url }) - ${ artifact.size } MB`;
	} else if ( buildStatus === 'failure' ) {
		status = previewMsg = artifactMsg = '🚫  Build failed!';
	}

	const response = await octokit.rest.markdown.render( {
		mode: 'gfm',
		text: `
# Gutenberg Plugin build status

| Name                    	| Result |
| ----------------------- 	| - |
| **Last commit:**        	| ${ latestCommit } |
| **Status**:             	| ${ status } |
| **Preview URL**:        	| ${ previewMsg } |
| **Gutenberg plugin zip**: | ${ artifactMsg } |
  `,
	} );
	return `<!--${ COMMENT_PLACEHOLDER }-->${ response.data }`;
};

const writeComment = async (
	{ owner, repo, pullRequestNumber, commentBody },
	octokit
) => {
	debug( 'pr-preview-link: Find and replace build status comment' );
	// First check if there is already a comment from this action
	const comments = await octokit.rest.issues.listComments( {
		issue_number: pullRequestNumber,
		owner,
		repo,
	} );

	const existingComment = comments.data.filter( ( comment ) =>
		comment.body.includes( COMMENT_PLACEHOLDER )
	);

	if ( existingComment.length ) {
		await octokit.rest.issues.updateComment( {
			owner,
			repo,
			comment_id: existingComment[ 0 ].id,
			body: commentBody,
		} );
	} else {
		await octokit.rest.issues.createComment( {
			owner,
			repo,
			issue_number: pullRequestNumber,
			body: commentBody,
		} );
	}
};

/**
 * Adds a comment to new PRs with a link to the corresponding gutenberg.run preview site.
 *
 * @param {WorkflowRunEvent} payload Workflow Run event payload.
 * @param {GitHub}           octokit Initialized Octokit REST client.
 */
async function prPreviewLink( payload, octokit ) {
	const action = payload.action;
	const repo = payload.repository.name;
	const owner = payload.repository.owner.login;
	const repoHtmlUrl = payload.repository.html_url;
	const workflowRun = payload.workflow_run;

	if ( ! workflowRun || workflowRun?.event === 'workflow_dispatch' ) {
		return;
	}

	const workflowRunId = workflowRun.id;
	const pullRequestNumber = workflowRun.pull_requests[ 0 ].number;
	const checkSuiteId = workflowRun.check_suite_id;
	const latestCommit = `${ repoHtmlUrl }/pull/${ pullRequestNumber }/commits/${ workflowRun.head_sha }`;

	if ( action === 'in_progress' ) {
		const commentBody = await createBuildSummary(
			{
				buildStatus: action,
				latestCommit,
				pullRequestNumber,
				artifact: null,
			},
			octokit
		);

		await writeComment(
			{ owner, repo, pullRequestNumber, commentBody },
			octokit
		);
	}

	if ( action === 'completed' ) {
		debug( 'pr-preview-link: Build complete, request artifact from API' );
		const artifactsResponse =
			await octokit.rest.actions.listWorkflowRunArtifacts( {
				owner,
				repo,
				run_id: workflowRunId,
				name: 'gutenberg-plugin',
				per_page: 1,
			} );
		const artifacts = artifactsResponse.data.artifacts;

		let commentBody;
		if ( ! artifacts.length ) {
			debug( 'pr-preview-link: No artifact found, mark as failure' );

			commentBody = await createBuildSummary(
				{
					buildStatus: 'failure',
					latestCommit,
					pullRequestNumber,
					artifactsUrl: null,
				},
				octokit
			);
		} else {
			debug( 'pr-preview-link: Found artifact, mark as success' );

			const artifact = artifacts[ 0 ];
			// The artifact URL on Checks screen
			const artifactUrl = `${ repoHtmlUrl }/suites/${ checkSuiteId }/artifacts/${ artifact.id }`;
			const sizeInMB = artifact.size_in_bytes / ( 1024 * 1024 );
			commentBody = await createBuildSummary(
				{
					buildStatus: 'success',
					latestCommit,
					pullRequestNumber,
					artifact: {
						url: artifactUrl,
						size: sizeInMB.toFixed( 2 ),
					},
				},
				octokit
			);
		}

		await writeComment(
			{ owner, repo, pullRequestNumber, commentBody },
			octokit
		);
	}
}

module.exports = prPreviewLink;
module.exports.COMMENT_PLACEHOLDER = COMMENT_PLACEHOLDER;
