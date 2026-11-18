/**
 * Data about a remote URL.
 */
export interface RemoteUrlData {
	/**
	 * Contents of the remote URL's `<title>` tag.
	 */
	title: string;
	/**
	 * URL of the remote URL's icon, such as its favicon.
	 */
	icon?: string;
	/**
	 * Contents of the remote URL's description meta tag.
	 */
	description?: string;
	/**
	 * URL of the remote URL's preview image, such as its `og:image`.
	 */
	image?: string;
	[ key: string ]: unknown;
}
