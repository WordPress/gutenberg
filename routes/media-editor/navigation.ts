export const MEDIA_LIBRARY_ADMIN_PATH = 'upload.php';

/**
 * Whether `referrer` is a page in the same wp-admin as `currentUrl`: same
 * origin, and under the directory of the current admin page (e.g.
 * `/wp-admin/`).
 *
 * @param referrer   The referring URL, usually `document.referrer`.
 * @param currentUrl The URL of the current page.
 */
export function isAdminReferrer( referrer: string, currentUrl: string ) {
	if ( ! referrer ) {
		return false;
	}
	let from: URL;
	let current: URL;
	try {
		from = new URL( referrer );
		current = new URL( currentUrl );
	} catch {
		return false;
	}
	const adminPath = current.pathname.slice(
		0,
		current.pathname.lastIndexOf( '/' ) + 1
	);
	return (
		from.origin === current.origin && from.pathname.startsWith( adminPath )
	);
}

/**
 * The Media Library URL to go to after an attachment is deleted, with the
 * query args the Media Library reads to show its notice. Moving to the trash
 * passes `ids` too, which the notice's Undo link uses.
 *
 * @param actionId     The id of the delete action.
 * @param attachmentId The id of the deleted attachment.
 */
export function getMediaLibraryUrlAfterDelete(
	actionId: string,
	attachmentId: number
) {
	const args: Record< string, string > =
		actionId === 'move-to-trash'
			? { trashed: '1', ids: String( attachmentId ) }
			: { deleted: '1' };
	return `${ MEDIA_LIBRARY_ADMIN_PATH }?${ new URLSearchParams( args ) }`;
}
