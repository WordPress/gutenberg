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
export type WPAutomationTask< Payload > = (
	payload: Payload,
	octokit: GitHub
) => Promise< void >;

/**
 * Automation run on a push.
 */
export interface WPPushAutomation {
	/**
	 * Webhook event name to match.
	 */
	event: 'push';
	/**
	 * Push events have no action.
	 */
	action?: never;
	/**
	 * Task to run.
	 */
	task: WPAutomationTask< WebhookPayloadPush >;
}

/**
 * Automation run when a pull request is opened.
 */
export interface WPPullRequestAutomation {
	/**
	 * Webhook event name to match.
	 */
	event: 'pull_request_target';
	/**
	 * Action to match.
	 */
	action: 'opened';
	/**
	 * Task to run.
	 */
	task: WPAutomationTask< WebhookPayloadPullRequest >;
}

/**
 * Automation, matched by given properties against the incoming payload
 * object.
 */
export type WPAutomation = WPPushAutomation | WPPullRequestAutomation;
