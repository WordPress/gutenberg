/**
 * Function returning a sessionStorage key to set or retrieve a given post's
 * automatic session backup.
 *
 * Keys are crucially prefixed with 'wp-autosave-' so that wp-login.php's
 * `loggedout` handler can clear sessionStorage of any user-private content.
 *
 * @see https://github.com/WordPress/wordpress-develop/blob/6dad32d2aed47e6c0cf2aee8410645f6d7aba6bd/src/wp-login.php#L103
 *
 * @param {string}  postId    Post ID.
 * @param {boolean} isPostNew Whether post new.
 *
 * @return {string} sessionStorage key
 */
function postKey( postId, isPostNew ) {
	return `wp-autosave-block-editor-post-${
		isPostNew ? 'auto-draft' : postId
	}`;
}

/**
 * Returns the parsed session backup of a given post as `title`, `content`,
 * and `excerpt` edits, or null when there is no usable backup.
 *
 * @param {string}  postId    Post ID.
 * @param {boolean} isPostNew Whether post new.
 *
 * @return {Object|null} Backed-up post edits, if any.
 */
export function localAutosaveGet( postId, isPostNew ) {
	const backup = window.sessionStorage.getItem(
		postKey( postId, isPostNew )
	);
	if ( ! backup ) {
		return null;
	}

	try {
		const { post_title: title, content, excerpt } = JSON.parse( backup );
		return { title, content, excerpt };
	} catch {
		// Not usable if it can't be parsed.
		return null;
	}
}

export function localAutosaveSet( postId, isPostNew, title, content, excerpt ) {
	window.sessionStorage.setItem(
		postKey( postId, isPostNew ),
		JSON.stringify( {
			post_title: title,
			content,
			excerpt,
		} )
	);
}

export function localAutosaveClear( postId, isPostNew ) {
	window.sessionStorage.removeItem( postKey( postId, isPostNew ) );
}
