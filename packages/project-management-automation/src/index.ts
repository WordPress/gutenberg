import { setFailed, getInput } from '@actions/core';
import { getOctokit, context } from '@actions/github';
import assignFixedIssues from './tasks/assign-fixed-issues/index.js';
import firstTimeContributorAccountLink from './tasks/first-time-contributor-account-link/index.js';
import firstTimeContributorLabel from './tasks/first-time-contributor-label/index.js';
import addMilestone from './tasks/add-milestone/index.js';
import debug from './debug.js';
import type {
	GitHub,
	WebhookPayloadPullRequest,
	WebhookPayloadPush,
	Automation,
} from './types.js';

/**
 * Full list of automations, matched by given properties against the incoming
 * payload object.
 */
const automations: Automation[] = [
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

/**
 * Runs an automation's task with the payload of its event.
 *
 * @param automation Automation to run.
 * @param octokit    Initialized Octokit REST client.
 */
function runAutomation(
	automation: Automation,
	octokit: GitHub
): Promise< void > {
	switch ( automation.event ) {
		case 'push':
			return automation.task(
				context.payload as WebhookPayloadPush,
				octokit
			);
		case 'pull_request_target':
			return automation.task(
				context.payload as WebhookPayloadPullRequest,
				octokit
			);
	}
}

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

	for ( const automation of automations ) {
		const { event, action, task } = automation;
		if (
			event === context.eventName &&
			( action === undefined || action === context.payload.action )
		) {
			try {
				debug( `main: Starting task ${ task.name }` );
				await runAutomation( automation, octokit );
			} catch ( error ) {
				setFailed(
					`main: Task ${ task.name } failed with error: ${ error }`
				);
			}
		}
	}

	debug( 'main: All done!' );
} )();
