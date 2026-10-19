import type { getOctokit } from '@actions/github';
import type { components } from '@octokit/openapi-webhooks-types';

/**
 * Initialized Octokit REST client.
 */
export type GitHub = ReturnType< typeof getOctokit >;

/**
 * Push event payload.
 */
export type WebhookPayloadPush = components[ 'schemas' ][ 'webhook-push' ];

/**
 * Commit object from a push event payload.
 */
export type WebhookPayloadPushCommit =
	WebhookPayloadPush[ 'commits' ][ number ];

/**
 * Pull request opened event payload.
 */
export type WebhookPayloadPullRequest =
	components[ 'schemas' ][ 'webhook-pull-request-opened' ];

/**
 * Milestone, as listed by the REST API.
 */
export type Milestone = Awaited<
	ReturnType< GitHub[ 'rest' ][ 'issues' ][ 'listMilestones' ] >
>[ 'data' ][ number ];

/**
 * Automation task function.
 */
export type WPAutomationTask = (
	payload: any,
	octokit: GitHub
) => Promise< void >;

/**
 * Automation, matched by given properties against the incoming payload
 * object.
 */
export interface WPAutomation {
	/**
	 * Webhook event name to match.
	 */
	event: string;
	/**
	 * Action to match, if applicable.
	 */
	action?: string;
	/**
	 * Task to run.
	 */
	task: WPAutomationTask;
}
