
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

const createBuildSummary = async ( { buildStatus, latestCommit, pullRequestNumber, artifact }, octokit ) => {
	let status, previewMsg, artifactMsg;
	status = previewMsg = artifactMsg = "🚧  Building in progress...";
	if (buildStatus === "success") {
		status = "✅  Build successful!";
		previewMsg = `🔗 [gutenberg.run/${ pullRequestNumber }](gutenberg.run/${ pullRequestNumber })`;
		artifactMsg = `📦 [gutenberg-plugin](${ artifact.url }) - ${ artifact.size } MB`;
	} else if (buildStatus === "failure") {
		status = previewMsg = artifactMsg = "🚫  Build failed!";
	}

	debug(JSON.stringify({ buildStatus, latestCommit, pullRequestNumber, artifact }))

	const response = await octokit.rest.markdown.render( {
		mode: 'gfm',
		text:
			`
# Gutenberg Plugin build status

| Name                    	| Result |
| ----------------------- 	| - |
| **Last commit:**        	| ${ latestCommit } |
| **Status**:             	| ${ status } |
| **Preview URL**:        	| ${ previewMsg } |
| **Gutenberg plugin zip**: | ${ artifactMsg } |
  `
	} )
	return `<!--${ COMMENT_PLACEHOLDER }-->${ response.data }`;
};

const writeComment = async ( { owner, repo, pullRequestNumber, commentBody }, octokit ) => {
	// First check if there is already a comment from this action
	const comments = await octokit.rest.issues.listComments( {
		issue_number: pullRequestNumber,
		owner: owner,
		repo: repo,
	} );

	const existingComment = comments.data.filter( comment => comment.body.includes( COMMENT_PLACEHOLDER ) );
	
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
}

/**
 * Adds a comment to new PRs with a link to the corresponding gutenberg.run preview site.
 *
 * @param {WorkflowRunEvent} 		payload Workflow Run event payload.
 * @param {GitHub}                  octokit Initialized Octokit REST client.
 */
async function prPreviewLink( payload, octokit ) {
	const action 		= payload.action;
	const repo 			= payload.repository.name;
	const owner 		= payload.repository.owner.login;
	const repoHtmlUrl 	= payload.repository.html_url;
    const workflowRun 	= payload.workflow_run;
	const workflowRunId = workflowRun.id; // payload.workflow_run.event === 'workflow_dispatch'

	debug( `workflow_run ${ action } detail` );
	debug( JSON.stringify(payload) );

	const pullRequestNumber = workflowRun.pull_requests[ 0 ].number;
	const checkSuiteId 		= workflowRun.check_suite_id;
	const latestCommit 		= `${ repoHtmlUrl }/pull/${ pullRequestNumber }/commits/${ workflowRun.head_sha }`;
	  
	if ( action === 'in_progress' ) {
		const commentBody = await createBuildSummary( {
			buildStatus: action, latestCommit, pullRequestNumber, artifact: null
		}, octokit);

		await writeComment( { owner, repo, pullRequestNumber, commentBody }, octokit );
	}

	if ( action === 'completed' ) {
		const artifactsResponse = await octokit.rest.actions.listWorkflowRunArtifacts({
			owner,
			repo,
			run_id: workflowRunId,
			name: 'gutenberg-plugin',
			per_page: 1
		});
		const artifacts = artifactsResponse.data.artifacts;
		debug( JSON.stringify(artifacts) );

		let commentBody;
		if ( ! artifacts.length ) {
			commentBody = await createBuildSummary({
				buildStatus: 'failure', latestCommit, pullRequestNumber, artifactsUrl: null
			}, octokit);
		} else {
			const artifact = artifacts[ 0 ];
			// The artifact URL on Checks screen
			const artifactUrl = `${ repoHtmlUrl }/suites/${ checkSuiteId }/artifacts/${artifact.id}`;
			const sizeInMB = artifact.size_in_bytes / (1024 * 1024);
			commentBody = await createBuildSummary({
				buildStatus: 'success', latestCommit, pullRequestNumber, artifact: {
					url: artifactUrl,
					size: sizeInMB.toFixed( 2 )
				}
			}, octokit);
		}

		await writeComment( { owner, repo, pullRequestNumber, commentBody }, octokit);
	}

	return;
	debug(JSON.stringify(payload));

	debug( 'workflow_run: run detail' );
	// Get latest workflow_run for the 
	const res = await octokit.rest.actions.listWorkflowRuns({
		owner,
		repo,
		workflow_id: "build-plugin-zip.yml",
		per_page: 1
	  });
	// Parse the response and extract the download URL or other information
	const workflow = res.data;
	debug( JSON.stringify(workflow) );
	
	debug( 'artifacts: detail data.' );
	// Retrieve artifacts for a specific workflow run
	const runId = 6035878166;
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
	
	const artifacts = await getArtifacts("WordPress", repo, runId)

	debug( 'pr-preview-link: Adding comment to PR.' );
	const commentBody = await createBuildSummary({
		buildStatus: 'success', latestCommit, pullRequestNumber, artifactsUrl: 'https://github.com/WordPress/gutenberg/suites/14933339105/artifacts/851299943'
	}, octokit);

	await octokit.rest.issues.createComment( {
		owner,
		repo,
		issue_number: pullRequestNumber,
		body: commentBody,
	} );
}

module.exports = prPreviewLink;
