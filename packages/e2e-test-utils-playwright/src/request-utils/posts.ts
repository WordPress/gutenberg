/**
 * Internal dependencies
 */
import type { RequestUtils } from './index';

export interface Post {
	id: number;
	content: string;
	status: 'publish' | 'future' | 'draft' | 'pending' | 'private';
}

export interface CreatePostPayload {
	content: string;
	status: 'publish' | 'future' | 'draft' | 'pending' | 'private';
}

/**
 * Delete all posts using REST API.
 *
 * @param {} this RequestUtils.
 */
export async function deleteAllPosts( this: RequestUtils ) {
	// List all posts.
	// https://developer.wordpress.org/rest-api/reference/posts/#list-posts
	const posts = await this.rest< Post[] >( {
		path: '/wp/v2/posts',
		params: {
			per_page: 100,
			// All possible statuses.
			status: 'publish,future,draft,pending,private,trash',
		},
	} );

	// Delete all posts one by one.
	// https://developer.wordpress.org/rest-api/reference/posts/#delete-a-post
	// "/wp/v2/posts" not yet supports batch requests.
	await Promise.all(
		posts.map( ( post ) =>
			this.rest( {
				method: 'DELETE',
				path: `/wp/v2/posts/${ post.id }`,
				params: {
					force: true,
				},
			} )
		)
	);
}

/**
 * Creates a new post using the REST API.
 *
 * @param {} this    RequestUtils.
 * @param {} payload Post attributes.
 */
export async function createPost(
	this: RequestUtils,
	payload: CreatePostPayload
) {
	const post = await this.rest< Post >( {
		method: 'POST',
		path: `/wp/v2/posts`,
		params: { ...payload },
	} );

	return post;
}
