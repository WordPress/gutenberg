/**
 * Returns a key for the site, so that two sites on a subdirectory multisite,
 * which share an origin, do not share a window name. It is the site's own path,
 * and is empty on a single site.
 *
 * @param siteUrl The URL of the site the post belongs to.
 *
 * @return The site's path, or an empty string.
 */
function getSiteKey( siteUrl: string | undefined ): string {
	if ( ! siteUrl ) {
		return '';
	}

	try {
		const { pathname } = new URL( siteUrl );
		return pathname === '/' ? '' : pathname.replace( /\/$/, '' );
	} catch {
		return '';
	}
}

/**
 * Returns the target for a front-end link to a post, so that each post reuses
 * one tab instead of opening another on every click.
 *
 * Only a same-origin link gets a named target. A named target gets no implicit
 * `noopener`, so a cross-origin page could navigate the editor tab through
 * `window.opener`, and plugins can filter a permalink to any URL.
 *
 * @see https://github.com/WordPress/gutenberg/issues/28479
 *
 * @param postId  The ID of the post being viewed.
 * @param url     The front-end URL the link points to.
 * @param siteUrl The URL of the site the post belongs to.
 *
 * @return The window name to reuse, or `_blank`.
 */
export function getPostViewTarget(
	postId: number | string | undefined,
	url: string | undefined,
	siteUrl?: string
): string {
	if ( postId === undefined || ! url ) {
		return '_blank';
	}

	try {
		const { origin } = new URL( url, document.baseURI );
		if ( origin !== window.location.origin ) {
			return '_blank';
		}
	} catch {
		return '_blank';
	}

	return `wp-post${ getSiteKey( siteUrl ) }-${ postId }`;
}

/**
 * Opens a post's front end in the window the target names.
 *
 * A named window gets no implicit `noopener`, so its opener is cleared before
 * the post loads, which stops the destination navigating the editor tab even if
 * the permalink redirects off site. The window stays reachable by name while it
 * is same origin, so repeat views still reuse the tab.
 *
 * @see https://github.com/WordPress/gutenberg/issues/28479
 *
 * @param url    The front-end URL to open.
 * @param target The window name, or `_blank`.
 */
export function openPostView( url: string, target: string ): void {
	if ( target === '_blank' ) {
		// Unlike a link, `window.open()` has no implicit `noopener`.
		window.open( url, target, 'noopener' );
		return;
	}

	const viewWindow = window.open( '', target );
	if ( ! viewWindow ) {
		window.open( url, target );
		return;
	}

	try {
		viewWindow.opener = null;
	} catch {
		// Already on another origin, which means the permalink redirected off
		// site. Its opener was cleared when it opened.
	}

	viewWindow.location = url as string & Location;
}

/**
 * Handles a click on a front-end link to a post, so that the post opens with
 * its opener cleared. See `openPostView`.
 *
 * Modified and non-primary clicks are left to the browser, which opens them in
 * a new tab of their own rather than reusing the post's window.
 *
 * @param event The click event.
 */
export function onPostViewLinkClick(
	event: React.MouseEvent< HTMLAnchorElement >
): void {
	const link = event.currentTarget;
	const target = link.target;

	// The browser gives a `_blank` link `noopener` already.
	if ( ! target || target === '_blank' ) {
		return;
	}

	if (
		event.defaultPrevented ||
		event.button !== 0 ||
		event.metaKey ||
		event.ctrlKey ||
		event.shiftKey ||
		event.altKey
	) {
		return;
	}

	const viewWindow = window.open( '', target );
	if ( ! viewWindow ) {
		// Blocked, so let the browser follow the link instead.
		return;
	}

	event.preventDefault();

	try {
		viewWindow.opener = null;
	} catch {
		// Already on another origin. Its opener was cleared when it opened.
	}

	viewWindow.location = link.href as string & Location;
}
