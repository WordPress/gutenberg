/**
 * External dependencies
 */
import type { getOctokit } from '@actions/github';
import type { PushEvent } from '@octokit/webhooks-types';

/**
 * Internal dependencies
 */
import debug from '../../debug';
import getAssociatedPullRequest from '../../get-associated-pull-request';
import hasWordPressProfile from '../../has-wordpress-profile';

/**
 * Type definitions
 */
type GitHub = ReturnType< typeof getOctokit >;
/** @typedef {import('@octokit/webhooks-types').EventPayloadMap['push']} WebhookPayloadPush */
/** @typedef {import('../../get-associated-pull-request').WebhookPayloadPushCommit} WebhookPayloadPushCommit */

/**
 * Returns the message text to be used for the comment prompting contributor to
 * link their GitHub account from their WordPress.org profile for props credit.
 *
 * @param author GitHub username of author.
 * @return Message text.
 */
function getPromptMessageText( author: string ): string {
	return (
		'Congratulations on your first merged pull request, @' +
		author +
		"! We'd like to credit you for your contribution in the post " +
		"announcing the next WordPress release, but we can't find a " +
		'WordPress.org profile associated with your GitHub account. When you ' +
		'have a moment, visit the following URL and click "link your GitHub ' +
		'account" under "GitHub Username" to link your accounts:\n\n' +
		"https://profiles.wordpress.org/me/profile/edit/\n\nAnd if you don't " +
		'have a WordPress.org account, you can create one on this page:\n\n' +
		'https://login.wordpress.org/register\n\nKudos!'
	);
}

/**
 * Prompts the user to link their GitHub account to their WordPress.org profile
 * if necessary for props credit.
 *
 * @param payload Push event payload.
 * @param octokit Initialized Octokit REST client.
 */
async function firstTimeContributorAccountLink(
	payload: PushEvent,
	octokit: GitHub
): Promise< void > {
	if ( payload.ref !== 'refs/heads/trunk' ) {
		debug(
			'first-time-contributor-account-link: Commit is not to `trunk`. Aborting'
		);
		return;
	}

	const commit = payload.commits[ 0 ];
	const pullRequest = getAssociatedPullRequest( commit );
	if ( ! pullRequest ) {
		debug(
			'first-time-contributor-account-link: Cannot determine pull request associated with commit. Aborting'
		);
		return;
	}

	const { data: user } = await octokit.rest.users.getByUsername( {
		username: commit.author.username!,
	} );

	if ( user.type === 'Bot' ) {
		debug( 'first-time-contributor-account-link: User is a bot. Aborting' );
		return;
	}

	const repo = payload.repository.name;
	const owner = payload.repository.owner.login;
	const author = commit.author.username!;

	debug(
		`first-time-contributor-account-link: Searching for commits in ${ owner }/${ repo } by @${ author }`
	);

	const { data: commits } = await octokit.rest.repos.listCommits( {
		owner,
		repo,
		author,
	} );

	if ( commits.length > 1 ) {
		debug(
			`first-time-contributor-account-link: Not the first commit for author. Aborting`
		);
		return;
	}

	debug(
		`first-time-contributor-account-link: Checking for WordPress username associated with @${ author }`
	);

	let hasProfile;
	try {
		hasProfile = await hasWordPressProfile( author );
	} catch ( error ) {
		if ( error instanceof Object ) {
			debug(
				`first-time-contributor-account-link: Error retrieving from profile API:\n\n${ error.toString() }`
			);
		}
		return;
	}

	if ( hasProfile ) {
		debug(
			`first-time-contributor-account-link: User already known. No need to prompt for account link!`
		);
		return;
	}

	debug(
		'first-time-contributor-account-link: User not known. Adding comment to prompt for account link.'
	);

	await octokit.rest.issues.createComment( {
		owner,
		repo,
		issue_number: pullRequest,
		body: getPromptMessageText( author ),
	} );
}

export default firstTimeContributorAccountLink;
