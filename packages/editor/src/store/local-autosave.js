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

export function localAutosaveGet( postId, isPostNew ) {
	return window.sessionStorage.getItem( postKey( postId, isPostNew ) );
}

export function localAutosaveSet(
	postId,
	isPostNew,
	title,
	content,
	excerpt,
	crdtSnapshot
) {
	const backup = {
		post_title: title,
		content,
		excerpt,
	};

	// During real-time collaboration, record which shared document state this
	// backup captured. A later session can then verify that the shared
	// document already accounts for the backup's changes and skip the
	// "restore the backup" notice.
	if ( crdtSnapshot ) {
		backup.crdt_snapshot = crdtSnapshot;
	}

	window.sessionStorage.setItem(
		postKey( postId, isPostNew ),
		JSON.stringify( backup )
	);
}

export function localAutosaveClear( postId, isPostNew ) {
	window.sessionStorage.removeItem( postKey( postId, isPostNew ) );
}
