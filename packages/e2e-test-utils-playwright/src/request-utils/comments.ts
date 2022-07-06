/**
 * Internal dependencies
 */
import type { RequestUtils } from './index';

interface Comment {
	id: number;
}

/**
 * Delete all comments using the REST API.
 *
 * @param {} this RequestUtils.
 */
export async function deleteAllComments( this: RequestUtils ) {
	// List all comments.
	// https://developer.wordpress.org/rest-api/reference/comments/#list-comments
	const comments = await this.rest( {
		path: '/wp/v2/comments',
		params: {
			per_page: 100,
			// All possible statuses.
			status: 'unapproved,approved,spam,trash',
		},
	} );

	// Delete all comments one by one.
	// https://developer.wordpress.org/rest-api/reference/comments/#delete-a-comment
	// "/wp/v2/comments" doesn't support batch requests yet.
	await Promise.all(
		comments.map( ( comment: Comment ) =>
			this.rest( {
				method: 'DELETE',
				path: `/wp/v2/comments/${ comment.id }`,
				params: {
					force: true,
				},
			} )
		)
	);
}
