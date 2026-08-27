/**
 * Resolves an action href to a route path inside this SPA.
 *
 * A href belongs here when it targets the same document (origin and
 * pathname) and the same admin `page`; the route is then whatever `p`
 * carries. Anything a route navigation cannot deliver faithfully stays
 * a plain anchor: a hash, search params beyond `page` and `p`, duplicates
 * of either, or a `p` that is not a root-relative path or carries its own
 * query or hash.
 *
 * @param {string} href Action href, absolute or relative.
 * @param {string} base Document URL the href is judged against; defaults
 *                      to the current location.
 * @return {string | null} The in-app route path, or `null`.
 */
export function matchDashboardHref(
	href: string,
	base: string = window.location.href
): string | null {
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

	for ( const key of url.searchParams.keys() ) {
		if ( key !== 'page' && key !== 'p' ) {
			return null;
		}
	}

	/*
	 * On duplicates, `URLSearchParams.get()` reads the first value while
	 * PHP reads the last: the two navigations would diverge.
	 */
	if (
		url.searchParams.getAll( 'page' ).length > 1 ||
		url.searchParams.getAll( 'p' ).length > 1
	) {
		return null;
	}

	const path = url.searchParams.get( 'p' ) || '/';

	/*
	 * The router writes a root-relative pathname into `p`. Any other shape
	 * (`https://…`, `mailto:…`, `//host`, `reports`) the router link would
	 * resolve as an external URL or a relative path, where the full load
	 * cannot follow.
	 */
	if (
		! /^\/(?!\/)/.test( path ) ||
		path.includes( '?' ) ||
		path.includes( '#' )
	) {
		return null;
	}

	return path;
}
