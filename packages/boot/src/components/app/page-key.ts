/**
 * Returns the key identifying which wp-admin page a URL belongs to: the
 * `page` query argument for plugin pages (`admin.php?page=…`), or the file
 * name for Core pages (`font-library.php`).
 *
 * @param href URL to read. Defaults to the current location.
 * @return Page key.
 */
export function getPageKey( href: string = window.location.href ) {
	const url = new URL( href, window.location.href );
	return (
		url.searchParams.get( 'page' ) ?? url.pathname.split( '/' ).pop() ?? ''
	);
}
