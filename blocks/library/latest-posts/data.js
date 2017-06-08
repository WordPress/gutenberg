/**
 * Returns a Promise with the latest posts or an error on failure.
 *
 * @param   {Number} postsToShow       Number of posts to display.
 *
 * @returns {wp.api.collections.Posts} Returns a Promise with the latest posts.
 */
export function getLatestPosts( postsToShow = 5 ) {
	const postsCollection = new wp.api.collections.Posts();

	const posts = postsCollection.fetch( {
		data: {
			per_page: postsToShow,
		},
	} );

	return posts;
}

