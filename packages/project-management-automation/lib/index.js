/**
 * GitHub dependencies
 */
const { setFailed, getInput } = require( '@actions/core' );
const { context, GitHub } = require( '@actions/github' );

/**
 * Internal dependencies
 */
const assignFixedIssues = require( './assign-fixed-issues' );
const addFirstTimeContributorLabel = require( './add-first-time-contributor-label' );
const addMilestone = require( './add-milestone' );
const debug = require( './debug' );
const ifNotFork = require( './if-not-fork' );

const automations = [
	{
		event: 'pull_request',
		action: 'opened',
		task: ifNotFork( assignFixedIssues ),
	},
	{
		event: 'pull_request',
		action: 'opened',
		task: ifNotFork( addFirstTimeContributorLabel ),
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
