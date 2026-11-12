import { privateApis as coreDataPrivateApis } from '@wordpress/core-data';
import { unlock } from '../lock-unlock';

const { CRDT_AUTOSAVE_SNAPSHOT_KEY } = unlock( coreDataPrivateApis );

let hasStorageSupport;

/**
 * Function which returns true if the current environment supports browser
 * sessionStorage, or false otherwise. The result of this function is cached and
 * reused in subsequent invocations.
 */
export const hasSessionStorageSupport = () => {
	if ( hasStorageSupport !== undefined ) {
		return hasStorageSupport;
	}

	try {
		// Private Browsing in Safari 10 and earlier will throw an error when
		// attempting to set into sessionStorage. The test here is intentional in
		// causing a thrown error as condition bailing from local autosave.
		window.sessionStorage.setItem( '__wpEditorTestSessionStorage', '' );
		window.sessionStorage.removeItem( '__wpEditorTestSessionStorage' );
		hasStorageSupport = true;
	} catch {
		hasStorageSupport = false;
	}

	return hasStorageSupport;
};

/**
 * Function returning a sessionStorage key to set or retrieve a given post's
 * automatic session backup.
 *
 * Keys are crucially prefixed with 'wp-autosave-' so that wp-login.php's
 * `loggedout` handler can clear sessionStorage of any user-private content.
 *
 * @see https://github.com/WordPress/wordpress-develop/blob/6dad32d2aed47e6c0cf2aee8410645f6d7aba6bd/src/wp-login.php#L103
 *
 * @param {number|string} postId    Post ID.
 * @param {boolean}       isPostNew Whether post new.
 *
 * @return {string} sessionStorage key
 */
function postKey( postId, isPostNew ) {
	return `wp-autosave-block-editor-post-${
		isPostNew ? 'auto-draft' : postId
	}`;
}

/**
 * Returns the browser backup of a post.
 *
 * @param {number|string} postId    Post ID.
 * @param {boolean}       isPostNew Whether post new.
 *
 * @return {Object|null} The backup's `title`, `content`, `excerpt`, `time` and
 *                       CRDT `snapshot`, or null when there is none to use.
 */
export function getBrowserBackup( postId, isPostNew ) {
	if ( ! hasSessionStorageSupport() ) {
		return null;
	}

	const backup = window.sessionStorage.getItem(
		postKey( postId, isPostNew )
	);
	if ( ! backup ) {
		return null;
	}

	try {
		const {
			post_title: title,
			content,
			excerpt,
			time,
			[ CRDT_AUTOSAVE_SNAPSHOT_KEY ]: snapshot,
		} = JSON.parse( backup );
		return { title, content, excerpt, time, snapshot };
	} catch {
		return null;
	}
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
		time: Date.now(),
	};

	// During real-time collaboration, record which shared document state this
	// backup captured. A later session can then verify that the shared
	// document already accounts for the backup's changes and skip the
	// "restore the backup" notice.
	if ( crdtSnapshot ) {
		backup[ CRDT_AUTOSAVE_SNAPSHOT_KEY ] = crdtSnapshot;
	}

	const key = postKey( postId, isPostNew );

	try {
		window.sessionStorage.setItem( key, JSON.stringify( backup ) );
	} catch ( error ) {
		if ( ! backup[ CRDT_AUTOSAVE_SNAPSHOT_KEY ] ) {
			throw error;
		}

		// In the unlikely event that the snapshot is too large for storage,
		// ensure we still store content without a snapshot. At worst, this results
		// in a notice that locally-saved content is available that isn't necessary.
		delete backup[ CRDT_AUTOSAVE_SNAPSHOT_KEY ];
		window.sessionStorage.setItem( key, JSON.stringify( backup ) );
	}
}

/**
 * Removes the browser backup of a post.
 *
 * @param {number|string} postId    Post ID.
 * @param {boolean}       isPostNew Whether post new.
 * @param {number}        [time]    Keep the backup if it was made after this time,
 *                                  so edits backed up since are not lost.
 */
export function localAutosaveClear( postId, isPostNew, time ) {
	if (
		time !== undefined &&
		( getBrowserBackup( postId, isPostNew )?.time ?? 0 ) > time
	) {
		return;
	}

	window.sessionStorage.removeItem( postKey( postId, isPostNew ) );
}
