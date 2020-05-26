/**
 * Internal dependencies
 */
const debug = require( '../../debug' );
const getAssociatedPullRequest = require( '../../get-associated-pull-request' );
const hasWordPressProfile = require( '../../has-wordpress-profile' );

/** @typedef {import('@actions/github').GitHub} GitHub */
/** @typedef {import('@octokit/webhooks').WebhookPayloadPush} WebhookPayloadPush */
/** @typedef {import('../../get-associated-pull-request').WebhookPayloadPushCommit} WebhookPayloadPushCommit */

/**
 * Returns the message text to be used for the comment prompting contributor to
 * link their GitHub account from their WordPress.org profile for props credit.
 *
 * @param {string} author GitHub username of author.
 *
 * @return {string} Message text.
 */
function getPromptMessageText( author ) {
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
 * Adds the 'First Time Contributor' label to PRs merged on behalf of
 * contributors that have not yet made a commit, and prompts the user to link
 * their GitHub account to their WordPress.org profile if neccessary for props
 * credit.
 *
 * @param {WebhookPayloadPush} payload Push event payload.
 * @param {GitHub}             octokit Initialized Octokit REST client.
 */
async function firstTimeContributor( payload, octokit ) {
	if ( payload.ref !== 'refs/heads/master' ) {
		debug( 'first-time-contributor: Commit is not to `master`. Aborting' );
		return;
	}

	const commit =
		/** @type {WebhookPayloadPushCommit} */ ( payload.commits[ 0 ] );
	const pullRequest = getAssociatedPullRequest( commit );
	if ( ! pullRequest ) {
		debug(
			'first-time-contributor: Cannot determine pull request associated with commit. Aborting'
		);
		return;
	}

	const repo = payload.repository.name;
	const owner = payload.repository.owner.login;
	const author = commit.author.username;
	debug(
		`first-time-contributor: Searching for commits in ${ owner }/${ repo } by @${ author }`
	);

	const { data: commits } = await octokit.repos.listCommits( {
		owner,
		repo,
		author,
	} );

	if ( commits.length > 1 ) {
		debug(
			`first-time-contributor: Not the first commit for author. Aborting`
		);
		return;
	}

	debug(
		`first-time-contributor: Adding 'First Time Contributor' label to issue #${ pullRequest }`
	);

	await octokit.issues.addLabels( {
		owner,
		repo,
		issue_number: pullRequest,
		labels: [ 'First-time Contributor' ],
	} );

	debug(
		`first-time-contributor: Checking for WordPress username associated with @${ author }`
	);

	let hasProfile;
	try {
		hasProfile = await hasWordPressProfile( author );
	} catch ( error ) {
		debug(
			`first-time-contributor: Error retrieving from profile API:\n\n${ error.toString() }`
		);
		return;
	}

	if ( hasProfile ) {
		debug(
			`first-time-contributor: User already known. No need to prompt for account link!`
		);
		return;
	}

	debug(
		'first-time-contributor: User not known. Adding comment to prompt for account link.'
	);

	await octokit.issues.createComment( {
		owner,
		repo,
		issue_number: pullRequest,
		body: getPromptMessageText( author ),
	} );
}

module.exports = firstTimeContributor;
