/**
 * Returns if the params match the list page route.
 *
 * @param {Object} params          The search params.
 * @param {string} params.postId   The post ID.
 * @param {string} params.postType The post type.
 * @return {boolean} Is list page or not.
 */
export default function getIsListPage( { postId, postType } ) {
	return !! ( ! postId && postType );
}
