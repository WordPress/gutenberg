/**
 * GitHub dependencies
 */
const { setFailed, getInput } = require( '@actions/core' );
const { context, GitHub } = require( '@actions/github' );

/**
 * Internal dependencies
 */
const assignFixedIssues = require( './assign-fixed-issues' );
const firstTimeContributor = require( './first-time-contributor' );
const addMilestone = require( './add-milestone' );
const debug = require( './debug' );
const ifNotFork = require( './if-not-fork' );

/** @typedef {import('@actions/github').GitHub} GitHub */

/**
 * Automation task function.
 *
 * @typedef {(payload:any,octokit:GitHub)=>void} WPAutomationTask
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
		event: 'pull_request',
		action: 'opened',
		task: ifNotFork( assignFixedIssues ),
	},
	{
		event: 'push',
		task: firstTimeContributor,
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

	const octokit = new GitHub( token );

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
