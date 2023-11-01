/**
 * @typedef WebhookPayloadPushCommitAuthor
 *
 * @property {string} name     Author name.
 * @property {string} email    Author email.
 * @property {string} username Author username.
 */

/**
 * Minimal type detail of GitHub Push webhook event payload, for lack of their
 * own.
 *
 * TODO: If GitHub improves this on their own webhook payload types, this type
 * should no longer be necessary.
 *
 * @typedef {Record<string,*>} WebhookPayloadPushCommit
 *
 * @property {string}                         message Commit message.
 * @property {WebhookPayloadPushCommitAuthor} author  Commit author.
 *
 * @see https://developer.github.com/v3/activity/events/types/#pushevent
 */

/**
 * Given a commit object, returns a promise resolving with the pull request
 * number associated with the commit, or null if an associated pull request
 * cannot be determined.
 *
 * @param {WebhookPayloadPushCommit} commit Commit object.
 *
 * @return {number?} Pull request number, or null if it cannot be
 *                            determined.
 */
function getAssociatedPullRequest( commit ) {
	const match = commit.message.match( /\(#(\d+)\)$/m );
	return match && Number( match[ 1 ] );
}

module.exports = getAssociatedPullRequest;
