/**
 * Restoring a revision loads the editor again, so the notice confirming it has
 * to survive the page it was created on.
 */
const STORAGE_KEY = 'wp-editor-restored-revision';

/**
 * Stores the notice for the next editor load.
 *
 * @param {Object}        notice          The restored revision.
 * @param {string}        notice.postType The post type of the restored post.
 * @param {string|number} notice.postId   The ID of the restored post.
 * @param {string}        [notice.date]   The date of the restored revision.
 */
export function setRestoredRevisionNotice( { postType, postId, date } ) {
	try {
		window.sessionStorage.setItem(
			STORAGE_KEY,
			JSON.stringify( { postType, postId: String( postId ), date } )
		);
	} catch {
		// Session storage can be unavailable or full. The notice is not
		// essential, and the restored post is shown either way.
	}
}

/**
 * Returns the stored notice for a post, if there is one, and removes it.
 *
 * @param {Object}        post          The post being loaded.
 * @param {string}        post.postType The post type.
 * @param {string|number} post.postId   The post ID.
 *
 * @return {?{date: ?string}} The restored revision, or null when there is
 *                            nothing to show for this post.
 */
export function takeRestoredRevisionNotice( { postType, postId } ) {
	let stored;

	try {
		stored = window.sessionStorage.getItem( STORAGE_KEY );
		window.sessionStorage.removeItem( STORAGE_KEY );
	} catch {
		return null;
	}

	if ( ! stored ) {
		return null;
	}

	let notice;
	try {
		notice = JSON.parse( stored );
	} catch {
		return null;
	}

	if (
		notice?.postType !== postType ||
		notice?.postId !== String( postId )
	) {
		return null;
	}

	return { date: typeof notice.date === 'string' ? notice.date : null };
}
