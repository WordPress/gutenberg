/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * @typedef {import('./types').RevisionDiff} RevisionDiff
 */

/**
 * Fetches the block-level diff between two revisions.
 *
 * @param {number} postId - The ID of the post
 * @param {number} fromId - The source revision ID
 * @param {number} toId   - The target revision ID
 * @return {Promise<RevisionDiff>} The revision diff data
 */
export async function fetchRevisionDiff( postId, fromId, toId ) {
	const path = `/gutenberg/v1/posts/${ postId }/revisions/diff?from=${ fromId }&to=${ toId }`;

	return apiFetch( { path } );
}

/**
 * Fetches the list of revisions for a post.
 *
 * @param {number} postId - The ID of the post
 * @return {Promise<Array>} Array of revision objects
 */
export async function fetchRevisions( postId ) {
	const path = `/wp/v2/posts/${ postId }/revisions`;

	return apiFetch( { path } );
}
