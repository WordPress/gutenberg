import { setFailed, getInput } from '@actions/core';
import { getOctokit, context } from '@actions/github';
import assignFixedIssues from './tasks/assign-fixed-issues/index.js';
import firstTimeContributorAccountLink from './tasks/first-time-contributor-account-link/index.js';
import firstTimeContributorLabel from './tasks/first-time-contributor-label/index.js';
import addMilestone from './tasks/add-milestone/index.js';
import debug from './debug.js';

/**
 * Type definitions
 */
type GitHub = ReturnType< typeof getOctokit >;

/**
 * Automation task function.
 *
 * @typedef {( payload: any, octokit: ReturnType<typeof getOctokit> ) => void} WPAutomationTask
 */
type WPAutomationTask = ( payload: any, octokit: GitHub ) => Promise< void >;

/**
 * Full list of automations, matched by given properties against the incoming
 * payload object.
 */
interface WPAutomation {
	event: string;
	action?: string;
	task: WPAutomationTask;
}

const automations: WPAutomation[] = [
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
