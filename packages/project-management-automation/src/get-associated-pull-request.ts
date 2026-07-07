/**
 * External dependencies
 */
import type { Commit } from '@octokit/webhooks-types';

/**
 * Given a commit object, returns a promise resolving with the pull request
 * number associated with the commit, or null if an associated pull request
 * cannot be determined.
 *
 * @param commit Commit object.
 * @return Pull request number, or null if it cannot be determined.
 */
function getAssociatedPullRequest( commit: Commit ): number | null {
	const match = commit.message.match( /\(#(\d+)\)$/m );
	return match ? Number( match[ 1 ] ) : null;
}

export default getAssociatedPullRequest;
