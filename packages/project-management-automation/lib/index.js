/**
 * External dependencies
 */
const { setFailed, getInput } = require( '@actions/core' );
const { getOctokit, context } = require( '@actions/github' );

/**
 * Internal dependencies
 */
const assignFixedIssues = require( './tasks/assign-fixed-issues' );
const firstTimeContributorAccountLink = require( './tasks/first-time-contributor-account-link' );
const firstTimeContributorLabel = require( './tasks/first-time-contributor-label' );
const addMilestone = require( './tasks/add-milestone' );
const debug = require( './debug' );

/**
 * Automation task function.
 *
 * @typedef {( payload: any, octokit: ReturnType<getOctokit> ) => void} WPAutomationTask
 */

/**
 * Full list of automations, matched by given properties against the incoming
 * payload object.
 *
 * @typedef WPAutomation
 *
 * @property {string}           event    Webhook event name to match.
 * @property {string}           [action] Action to match, if applicable.
 * @property {WPAutomationTask} task     Task to run.
 */

/**
 * @type {WPAutomation[]}
 */
const automations = [
	{
		event: 'pull_request_target',
		action: 'opened',
		task: assignFixedIssues,
	},
	{
		event: 'pull_request_target',
		action: 'opened',
		task: firstTimeContributorLabel,
	},
	{
		event: 'push',
		task: firstTimeContributorAccountLink,
	},
	{
		event: 'push',
		task: addMilestone,
	},
];

( async function main() {
	const token = getInput( 'github_token' );
	if ( ! token ) {
		setFailed( 'main: Input `github_token` is required' );
		return;
	}

	const octokit = getOctokit( token );

	debug(
		`main: Received event = '${ context.eventName }', action = '${ context.payload.action }'`
	);

	for ( const { event, action, task } of automations ) {
		if (
			event === context.eventName &&
			( action === undefined || action === context.payload.action )
		) {
			try {
				debug( `main: Starting task ${ task.name }` );
				await task( context.payload, octokit );
			} catch ( error ) {
				setFailed(
					`main: Task ${ task.name } failed with error: ${ error }`
				);
			}
		}
	}

	debug( 'main: All done!' );
} )();
