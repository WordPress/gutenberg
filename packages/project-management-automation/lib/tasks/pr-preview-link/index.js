// @ts-nocheck

/**
 * Internal dependencies
 */
const debug = require( '../../debug' );

/** @typedef {ReturnType<import('@actions/github').getOctokit>} GitHub */
/** @typedef {any} WorkflowRunEvent */

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
	const workflowRunId = workflowRun.id;

	debug( `workflow_run ${ action } detail` );
	debug( JSON.stringify(payload) );

	const pullRequestNumber = workflowRun.pull_requests[ 0 ].number;
	const checkSuiteId 		= workflowRun.check_suite_id;
	const latestCommit 		= `${ repoHtmlUrl }/pull/${ pullRequestNumber }/commits/${ workflowRun.head_sha }`;
	  
	if ( action === 'in_progress' ) {
        debug( `workflow_run: building in_progress` );
    }

	if ( action === 'completed' ) {
        debug( `workflow_run: building completed` );
    }
}

module.exports = prPreviewLink;
