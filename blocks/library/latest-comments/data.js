/**
 * Returns a Promise with the latest comments or an error on failure.
 *
 * @param   {Number} commentsToShow       Number of comments to display.
 *
 * @returns {wp.api.collections.Comments} Returns a Promise with the latest comments.
 */
export function getLatestComments( commentsToShow = 5 ) {
	const commentsCollection = new wp.api.collections.Comments();

	const comments = commentsCollection.fetch( {
		data: {
			per_page: commentsToShow,
			_embed: true
		},
	} );

	return comments;
}

