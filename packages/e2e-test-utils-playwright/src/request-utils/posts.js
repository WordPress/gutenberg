/**
 * Delete all posts using REST API.
 *
 * @this {import('./index').RequestUtils}
 */
export async function deleteAllPosts() {
	// List all posts.
	// https://developer.wordpress.org/rest-api/reference/posts/#list-posts
	const posts = await this.rest( {
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
 * @param {string} content The content for the post.
 *
 * @return {Promise<number>} Post ID.
 */
export async function createPost( { content } ) {
	const post = await this.rest( {
		method: 'POST',
		path: `/wp/v2/posts`,
		params: { status: 'publish', content },
	} );

	return post.id;
}
