/**
 * Returns a Promise with the latest posts or an error on failure.
 *
 * @param   {Number} postsToShow       Number of posts to display.
 * @param   {String} order             Whether to sort in ascending or descending order: 'asc'|'desc'.
 * @param   {String} orderBy           Post parameter by which to sort posts.
 * @param   {String} categories        The terms assigned to the post in the category taxonomy.
 *
 * @returns {wp.api.collections.Posts} Returns a Promise with the latest posts.
 */
export function getLatestPosts( postsToShow, order, orderBy, categories ) {
	const postsCollection = new wp.api.collections.Posts();

	const posts = postsCollection.fetch( {
		data: {
			per_page: postsToShow,
			order,
			orderby: orderBy,
			categories,
		},
	} );

	return posts;
}

