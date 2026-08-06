import type { WidgetHostRouteMatch } from '@wordpress/widget-primitives';

/**
 * Resolves an action href to a route inside this SPA.
 *
 * A href belongs here when it targets the same document (origin and
 * pathname) and the same admin `page`; the route is then whatever `p`
 * carries. Hrefs with a hash stay plain anchors.
 *
 * @param {string} href Action href, absolute or relative.
 * @param {string} base Document URL the href is judged against; defaults
 *                      to the current location.
 * @return {WidgetHostRouteMatch | null} The in-app route, or `null`.
 */
export function matchDashboardHref(
	href: string,
	base: string = window.location.href
): WidgetHostRouteMatch | null {
	let url: URL;
	let baseUrl: URL;
	try {
		baseUrl = new URL( base );
		url = new URL( href, baseUrl );
	} catch {
		return null;
	}

	if (
		url.origin !== baseUrl.origin ||
		url.pathname !== baseUrl.pathname ||
		url.hash
	) {
		return null;
	}

	if (
		url.searchParams.get( 'page' ) !== baseUrl.searchParams.get( 'page' )
	) {
		return null;
	}

	return { to: url.searchParams.get( 'p' ) || '/' };
}
