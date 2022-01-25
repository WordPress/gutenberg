/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 * Delete all posts using REST API.
 *
 * @this {import('.').TestUtils}
 */
export async function deleteAllPosts() {
	const posts = await this.__experimentalRest( {
		path: addQueryArgs( '/wp/v2/posts', {
			per_page: -1,
			// All possible statuses.
			status: 'publish,future,draft,pending,private,trash',
		} ),
	} );

	// "/wp/v2/posts" not yet supports batch requests.
	await Promise.all(
		posts.map( ( post ) =>
			this.__experimentalRest( {
				method: 'DELETE',
				path: `/wp/v2/posts/${ post.id }?force=true`,
			} )
		)
	);
}
